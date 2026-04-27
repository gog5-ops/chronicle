import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { log } from "../logger.js";
import type { WorkerDefinition, WorkerResult } from "../types.js";

const OPS_LOG = "/opt/opshub/logs/ops.log";
const CHRONICLE_DIR = "/opt/opshub/wiki/chronicle";
const MARKER_FILE = "/opt/opshub/logs/.chronicle-last-offset";

function getChronicleFile(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${CHRONICLE_DIR}/${year}-${month}.md`;
}

function getLastOffset(): number {
  try {
    if (existsSync(MARKER_FILE)) {
      return parseInt(readFileSync(MARKER_FILE, "utf-8").trim(), 10) || 0;
    }
  } catch {
    // Start from beginning
  }
  return 0;
}

function saveOffset(offset: number): void {
  mkdirSync(dirname(MARKER_FILE), { recursive: true });
  writeFileSync(MARKER_FILE, String(offset), "utf-8");
}

function formatEntry(line: string): string {
  // ops.log format: ISO_TIMESTAMP [worker-name] [context] message → result
  // Chronicle format: - **HH:MM** `[context]` message → result
  const match = line.match(
    /^(\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}):\d{2}.\d+Z)\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/
  );
  if (!match) return `- ${line.trim()}`;

  const [, , time, worker, context, rest] = match;
  return `- **${time}** \`${worker}\` [${context}] ${rest}`;
}

async function run(): Promise<WorkerResult> {
  if (!existsSync(OPS_LOG)) {
    log("chronicle-append", "run", "ops.log not found", "skip");
    return { status: "ok", summary: "No ops.log to process" };
  }

  const content = readFileSync(OPS_LOG, "utf-8");
  const offset = getLastOffset();

  if (offset >= content.length) {
    log("chronicle-append", "run", "no new entries", "skip");
    return { status: "ok", summary: "No new entries since last sync" };
  }

  const newContent = content.slice(offset);
  const lines = newContent.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    saveOffset(content.length);
    return { status: "ok", summary: "No new entries since last sync" };
  }

  const formatted = lines.map(formatEntry).join("\n") + "\n";

  const chronicleFile = getChronicleFile();
  mkdirSync(dirname(chronicleFile), { recursive: true });

  // Append to monthly chronicle
  if (existsSync(chronicleFile)) {
    const existing = readFileSync(chronicleFile, "utf-8");
    writeFileSync(chronicleFile, existing + formatted, "utf-8");
  } else {
    const now = new Date();
    const header = `# Chronicle ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}\n\n`;
    writeFileSync(chronicleFile, header + formatted, "utf-8");
  }

  saveOffset(content.length);

  const summary = `Appended ${lines.length} entries to ${chronicleFile}`;
  log("chronicle-append", "run", summary, "ok");
  return { status: "ok", summary };
}

export const chronicleAppend: WorkerDefinition = {
  name: "chronicle-append",
  description: "Reads ops.log and appends formatted entries to monthly chronicle file",
  schedule: "0 * * * *",
  enabled: true,
  run,
};
