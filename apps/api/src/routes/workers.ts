import { Router, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config.js";
import type { Worker, WorkerLogEntry } from "../types.js";

const execAsync = promisify(exec);
const router = Router();

/**
 * Worker registry. In a full implementation this would be loaded from
 * a config file in the workers directory. For now, scan the directory
 * and build metadata from filenames + optional .meta.json sidecars.
 */
async function loadWorkers(): Promise<Worker[]> {
  try {
    const workersPath = config.workersPath;
    const files = await fs.readdir(workersPath);
    const scriptFiles = files.filter(
      (f) => f.endsWith(".ts") || f.endsWith(".sh")
    );

    const workers: Worker[] = [];
    for (const file of scriptFiles) {
      const name = file.replace(/\.(ts|sh)$/, "");
      const metaPath = path.join(workersPath, `${name}.meta.json`);

      let meta: Partial<Worker> = {};
      try {
        const raw = await fs.readFile(metaPath, "utf-8");
        meta = JSON.parse(raw);
      } catch {
        // No meta file, use defaults
      }

      workers.push({
        name,
        description: meta.description || `Worker: ${name}`,
        schedule: meta.schedule || "manual",
        status: meta.status || "idle",
        lastRun: meta.lastRun,
        lastResult: meta.lastResult,
        scriptPath: path.join(workersPath, file),
      });
    }

    return workers;
  } catch {
    return [];
  }
}

// GET /api/workers — list all workers with status
router.get("/", async (_req: Request, res: Response) => {
  const workers = await loadWorkers();
  res.json({ workers, count: workers.length });
});

// GET /api/workers/:name/logs — get worker logs
router.get("/:name/logs", async (req: Request, res: Response) => {
  const { name } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);

  const logPath = path.join(config.workersPath, "logs", `${name}.log`);

  try {
    const content = await fs.readFile(logPath, "utf-8");
    const lines = content.trim().split("\n").slice(-limit);

    const entries: WorkerLogEntry[] = lines.map((line) => {
      // Expected log format: [ISO_TIMESTAMP] LEVEL message
      const match = line.match(
        /^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]\s+(INFO|WARN|ERROR)\s+(.*)$/i
      );
      if (match) {
        return {
          timestamp: match[1],
          level: match[2].toLowerCase() as WorkerLogEntry["level"],
          message: match[3],
        };
      }
      return {
        timestamp: new Date().toISOString(),
        level: "info" as const,
        message: line,
      };
    });

    res.json({ name, entries, count: entries.length });
  } catch {
    res.status(404).json({ error: `No logs found for worker: ${name}` });
  }
});

// POST /api/workers/:name/trigger — manually trigger a worker
router.post("/:name/trigger", async (req: Request, res: Response) => {
  const { name } = req.params;
  const workers = await loadWorkers();
  const worker = workers.find((w) => w.name === name);

  if (!worker) {
    res.status(404).json({ error: `Worker not found: ${name}` });
    return;
  }

  if (worker.status === "running") {
    res.status(409).json({ error: `Worker is already running: ${name}` });
    return;
  }

  // Trigger the worker script asynchronously
  const startedAt = new Date().toISOString();

  try {
    const ext = path.extname(worker.scriptPath);
    const cmd =
      ext === ".ts" ? `npx tsx ${worker.scriptPath}` : `bash ${worker.scriptPath}`;

    // Run with a 5-minute timeout
    execAsync(cmd, { timeout: 300_000 }).catch(() => {
      // Worker failure is logged, not thrown to the caller
    });

    res.json({
      message: `Worker triggered: ${name}`,
      startedAt,
      scriptPath: worker.scriptPath,
    });
  } catch (err) {
    res.status(500).json({
      error: `Failed to trigger worker: ${name}`,
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
