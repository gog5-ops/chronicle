import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { log } from "../logger.js";
import type { WorkerDefinition, WorkerResult } from "../types.js";

const REPO = "gog5-ops/opshub";
const STATE_FILE = "/opt/opshub/logs/.issue-sync-last";

interface SyncState {
  lastSyncISO: string;
}

function loadState(): SyncState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as SyncState;
    }
  } catch {
    // Fresh start
  }
  // Default: look back 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return { lastSyncISO: oneHourAgo.toISOString() };
}

function saveState(state: SyncState): void {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function ghCommand(args: string): string {
  try {
    return execSync(`gh ${args}`, {
      encoding: "utf-8",
      timeout: 30_000,
      env: { ...process.env, GH_REPO: REPO },
    }).trim();
  } catch (err) {
    throw new Error(
      `gh command failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

interface IssueInfo {
  number: number;
  title: string;
  updatedAt: string;
}

async function run(): Promise<WorkerResult> {
  const state = loadState();
  const since = state.lastSyncISO;

  log("issue-sync", "run", `scanning since ${since}`);

  // List recently updated issues
  let issuesJson: string;
  try {
    issuesJson = ghCommand(
      `issue list --state all --json number,title,updatedAt --limit 50`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("issue-sync", "error", msg, "error");
    return { status: "error", summary: msg };
  }

  let issues: IssueInfo[];
  try {
    issues = JSON.parse(issuesJson) as IssueInfo[];
  } catch {
    return { status: "error", summary: "Failed to parse gh output" };
  }

  // Filter to issues updated since last sync
  const sinceDate = new Date(since);
  const updated = issues.filter((i) => new Date(i.updatedAt) > sinceDate);

  // Check for new comments on updated issues
  const withNewComments: Array<{ number: number; title: string; commentCount: number }> = [];

  for (const issue of updated) {
    try {
      const commentsJson = ghCommand(
        `issue view ${issue.number} --json comments --jq '.comments | map(select(.createdAt > "${since}")) | length'`
      );
      const count = parseInt(commentsJson, 10);
      if (count > 0) {
        withNewComments.push({
          number: issue.number,
          title: issue.title,
          commentCount: count,
        });
      }
    } catch {
      // Skip issues we can't read
    }
  }

  // Update state
  const newState: SyncState = { lastSyncISO: new Date().toISOString() };
  saveState(newState);

  const summary = `${updated.length} issues updated, ${withNewComments.length} with new comments`;
  log("issue-sync", "run", summary, "ok");

  return {
    status: "ok",
    summary,
    details: {
      updatedIssues: updated.map((i) => `#${i.number} ${i.title}`),
      newComments: withNewComments,
    },
  };
}

export const issueSync: WorkerDefinition = {
  name: "issue-sync",
  description: "Scans recent issues from gog5-ops/opshub for new comments since last sync",
  schedule: "*/30 * * * *",
  enabled: true,
  run,
};
