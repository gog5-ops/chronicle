import { execSync } from "node:child_process";
import { log } from "../logger.js";
import type { WorkerDefinition, WorkerResult } from "../types.js";

const EXPECTED_SESSIONS = ["slack", "telegram", "hermes"];

function checkTmuxSession(name: string): boolean {
  try {
    execSync(`tmux has-session -t ${name} 2>/dev/null`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

async function run(): Promise<WorkerResult> {
  const statuses: Record<string, boolean> = {};
  const missing: string[] = [];

  for (const session of EXPECTED_SESSIONS) {
    const alive = checkTmuxSession(session);
    statuses[session] = alive;
    if (!alive) {
      missing.push(session);
    }
  }

  if (missing.length === 0) {
    log("health-check", "result", "all services running", "ok");
    return {
      status: "ok",
      summary: `All ${EXPECTED_SESSIONS.length} services running`,
      details: statuses,
    };
  }

  const summary = `Missing: ${missing.join(", ")}`;
  log("health-check", "result", summary, "warn");
  return {
    status: "warn",
    summary,
    details: statuses,
  };
}

export const healthCheck: WorkerDefinition = {
  name: "health-check",
  description: "Checks if services are running (tmux sessions: slack, telegram, hermes)",
  schedule: "*/5 * * * *",
  enabled: true,
  run,
};
