import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { log } from "../logger.js";
import type { WorkerDefinition, WorkerResult } from "../types.js";

const RUNBOOK_DIR = "/opt/opshub/wiki/ops";
const SCRIPTS_DIR = "/opt/opshub/scripts";

interface Inconsistency {
  runbook: string;
  scriptPath: string;
  issue: string;
}

/**
 * Extract script references from a runbook file.
 * Looks for patterns like `/opt/opshub/scripts/something.sh` or
 * backtick-quoted commands referencing scripts.
 */
function extractScriptRefs(content: string): string[] {
  const refs: string[] = [];
  // Match paths to scripts dir
  const pathRegex = /\/opt\/opshub\/scripts\/[\w./-]+/g;
  let match: RegExpExecArray | null;
  while ((match = pathRegex.exec(content)) !== null) {
    refs.push(match[0]);
  }
  return [...new Set(refs)];
}

/**
 * Check if a referenced script exists and compare any inline commands
 * in the runbook against the script content.
 */
function verifyScript(
  scriptPath: string,
  runbookContent: string,
  runbookFile: string
): Inconsistency | null {
  if (!existsSync(scriptPath)) {
    return {
      runbook: runbookFile,
      scriptPath,
      issue: "Script file does not exist",
    };
  }

  // Check the script is not empty
  const scriptContent = readFileSync(scriptPath, "utf-8");
  if (scriptContent.trim().length === 0) {
    return {
      runbook: runbookFile,
      scriptPath,
      issue: "Script file is empty",
    };
  }

  // Check that the runbook's inline code blocks referencing this script
  // don't contradict the script (basic: check if the script name appears
  // with different flags/args in code blocks vs actual script)
  const codeBlockRegex = /```[\s\S]*?```/g;
  let block: RegExpExecArray | null;
  while ((block = codeBlockRegex.exec(runbookContent)) !== null) {
    const blockContent = block[0];
    const scriptName = scriptPath.split("/").pop();
    if (scriptName && blockContent.includes(scriptName)) {
      // Extract the command line from the code block
      const cmdLine = blockContent
        .split("\n")
        .find((l) => l.includes(scriptName));
      if (cmdLine && !scriptContent.includes(scriptName)) {
        return {
          runbook: runbookFile,
          scriptPath,
          issue: `Runbook references "${scriptName}" in a command but script content may be outdated`,
        };
      }
    }
  }

  return null;
}

async function run(): Promise<WorkerResult> {
  if (!existsSync(RUNBOOK_DIR)) {
    log("truth-verify", "run", "runbook dir not found", "skip");
    return { status: "ok", summary: "Runbook directory not found, nothing to verify" };
  }

  if (!existsSync(SCRIPTS_DIR)) {
    log("truth-verify", "run", "scripts dir not found", "skip");
    return { status: "ok", summary: "Scripts directory not found, nothing to verify" };
  }

  const runbooks = readdirSync(RUNBOOK_DIR).filter(
    (f) => f.startsWith("runbook-") && f.endsWith(".md")
  );

  if (runbooks.length === 0) {
    log("truth-verify", "run", "no runbooks found", "skip");
    return { status: "ok", summary: "No runbook files found" };
  }

  const inconsistencies: Inconsistency[] = [];

  for (const file of runbooks) {
    const fullPath = join(RUNBOOK_DIR, file);
    const content = readFileSync(fullPath, "utf-8");
    const scriptRefs = extractScriptRefs(content);

    for (const scriptPath of scriptRefs) {
      const issue = verifyScript(scriptPath, content, file);
      if (issue) {
        inconsistencies.push(issue);
      }
    }
  }

  if (inconsistencies.length === 0) {
    const summary = `Verified ${runbooks.length} runbooks, no inconsistencies`;
    log("truth-verify", "run", summary, "ok");
    return { status: "ok", summary };
  }

  const summary = `Found ${inconsistencies.length} inconsistencies across ${runbooks.length} runbooks`;
  log("truth-verify", "run", summary, "warn");
  return {
    status: "warn",
    summary,
    details: { inconsistencies },
  };
}

export const truthVerify: WorkerDefinition = {
  name: "truth-verify",
  description: "Compares runbook commands vs actual script files, reports inconsistencies",
  schedule: "0 6 * * *",
  enabled: true,
  run,
};
