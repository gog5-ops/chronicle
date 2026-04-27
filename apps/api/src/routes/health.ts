import { Router, type Request, type Response } from "express";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const router = Router();

const TRACKED_SESSIONS = ["slack", "telegram", "hermes"] as const;

router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "hermes-api",
    timestamp: new Date().toISOString(),
  });
});

router.get("/live", async (_req: Request, res: Response) => {
  const sessions: Record<string, boolean> = {};
  let tmuxAvailable = true;

  try {
    const { stdout } = await execAsync(
      "tmux list-sessions -F '#{session_name}'",
      { timeout: 2000 }
    );
    const running = new Set(
      stdout
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    for (const name of TRACKED_SESSIONS) {
      sessions[name] = running.has(name);
    }
  } catch {
    tmuxAvailable = false;
    for (const name of TRACKED_SESSIONS) sessions[name] = false;
  }

  const allUp = Object.values(sessions).every(Boolean);
  res.json({
    status: tmuxAvailable && allUp ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    tmuxAvailable,
    sessions,
  });
});

export default router;
