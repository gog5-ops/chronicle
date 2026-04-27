import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config.js";
import type {
  Worker,
  WorkerLogEntry,
  WorkerRunRecord,
  WorkerStatus,
} from "../types.js";

const execFileAsync = promisify(execFile);
const router = Router();

interface ManifestEntry {
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
}

interface Manifest {
  workers: ManifestEntry[];
}

const inFlight = new Set<string>();

async function loadManifest(): Promise<ManifestEntry[]> {
  try {
    const raw = await fs.readFile(config.workersManifestPath, "utf-8");
    const parsed = JSON.parse(raw) as Manifest;
    return Array.isArray(parsed.workers) ? parsed.workers : [];
  } catch {
    return [];
  }
}

async function readRunRecords(): Promise<WorkerRunRecord[]> {
  try {
    const raw = await fs.readFile(config.workerRunsLogPath, "utf-8");
    const records: WorkerRunRecord[] = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed) as WorkerRunRecord);
      } catch {
        // Skip malformed lines; the log is append-only and may have partial writes.
      }
    }
    return records;
  } catch {
    return [];
  }
}

async function appendRunRecord(record: WorkerRunRecord): Promise<void> {
  const dir = path.dirname(config.workerRunsLogPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(
    config.workerRunsLogPath,
    JSON.stringify(record) + "\n",
    "utf-8"
  );
}

function deriveStatus(
  entry: ManifestEntry,
  lastRecord: WorkerRunRecord | undefined,
  running: boolean
): WorkerStatus {
  if (running) return "running";
  if (!entry.enabled) return "disabled";
  if (lastRecord?.result.status === "error") return "failed";
  return "idle";
}

function toWorker(
  entry: ManifestEntry,
  recordsByName: Map<string, WorkerRunRecord[]>
): Worker {
  const records = recordsByName.get(entry.name) ?? [];
  const last = records[records.length - 1];
  return {
    name: entry.name,
    description: entry.description,
    schedule: entry.schedule,
    enabled: entry.enabled,
    status: deriveStatus(entry, last, inFlight.has(entry.name)),
    lastRun: last?.timestamp,
    lastResult: last
      ? last.result.status === "error"
        ? "failure"
        : "success"
      : undefined,
  };
}

async function buildWorkerList(): Promise<Worker[]> {
  const [entries, records] = await Promise.all([
    loadManifest(),
    readRunRecords(),
  ]);
  const byName = new Map<string, WorkerRunRecord[]>();
  for (const r of records) {
    const list = byName.get(r.name) ?? [];
    list.push(r);
    byName.set(r.name, list);
  }
  return entries.map((e) => toWorker(e, byName));
}

// GET /api/workers — list all workers from the manifest
router.get("/", async (_req, res) => {
  const workers = await buildWorkerList();
  res.json({ workers, count: workers.length });
});

// GET /api/workers/:name/logs — tail of ops.log filtered by worker name
router.get<{ name: string }>("/:name/logs", async (req, res) => {
  const { name } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);

  const logPath = path.join(config.workersPath, "logs", `${name}.log`);

  try {
    const content = await fs.readFile(logPath, "utf-8");
    const lines = content.trim().split("\n").slice(-limit);

    const entries: WorkerLogEntry[] = lines.map((line) => {
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

// GET /api/workers/:name/history — last N run records for this worker
router.get<{ name: string }>("/:name/history", async (req, res) => {
  const { name } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "10", 10), 100);

  const all = await readRunRecords();
  const filtered = all.filter((r) => r.name === name).slice(-limit);
  res.json({ name, runs: filtered, count: filtered.length });
});

// POST /api/workers/:name/trigger — execute the worker via the runner CLI
router.post<{ name: string }>("/:name/trigger", async (req, res) => {
  const { name } = req.params;

  const entries = await loadManifest();
  const entry = entries.find((e) => e.name === name);
  if (!entry) {
    res.status(404).json({ error: `Worker not found: ${name}` });
    return;
  }

  if (inFlight.has(name)) {
    res.status(409).json({ error: `Worker is already running: ${name}` });
    return;
  }

  inFlight.add(name);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  try {
    const { stdout } = await execFileAsync(
      "node",
      [config.workersRunnerPath, name],
      { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 }
    ).catch((err: NodeJS.ErrnoException & { stdout?: string; stderr?: string }) => {
      // The runner exits non-zero when result.status === "error" but still
      // prints the JSON result on stdout. Recover that payload instead of failing.
      if (typeof err.stdout === "string" && err.stdout.trim().length > 0) {
        return { stdout: err.stdout, stderr: err.stderr ?? "" };
      }
      throw err;
    });

    let result: WorkerRunRecord["result"];
    try {
      result = JSON.parse(stdout) as WorkerRunRecord["result"];
    } catch {
      result = {
        status: "error",
        summary: "Runner did not produce parseable JSON output",
        details: { stdout: stdout.slice(0, 4096) },
      };
    }

    const record: WorkerRunRecord = {
      timestamp: startedAt,
      name,
      result,
      durationMs: Date.now() - startMs,
    };
    await appendRunRecord(record);

    res.json(record);
  } catch (err) {
    const record: WorkerRunRecord = {
      timestamp: startedAt,
      name,
      result: {
        status: "error",
        summary: `Failed to execute worker: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      durationMs: Date.now() - startMs,
    };
    await appendRunRecord(record).catch(() => {
      // Best-effort: if we can't write the log we still return the error to the caller.
    });
    res.status(500).json(record);
  } finally {
    inFlight.delete(name);
  }
});

export default router;
