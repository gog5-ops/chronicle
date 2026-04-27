import { registry } from "./registry.js";
import { log } from "./logger.js";
import type { WorkerResult } from "./types.js";

/**
 * Run a single worker by name.
 * Logs start/end to ops.log and returns the result.
 */
export async function runWorker(name: string): Promise<WorkerResult> {
  const worker = registry.find((w) => w.name === name);

  if (!worker) {
    const result: WorkerResult = {
      status: "error",
      summary: `Worker "${name}" not found in registry`,
    };
    log(name, "runner", "lookup failed", result.summary);
    return result;
  }

  if (!worker.enabled) {
    const result: WorkerResult = {
      status: "warn",
      summary: `Worker "${name}" is disabled`,
    };
    log(name, "runner", "skipped (disabled)", result.summary);
    return result;
  }

  log(name, "runner", "started");

  const startMs = Date.now();
  let result: WorkerResult;

  try {
    result = await worker.run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result = {
      status: "error",
      summary: `Unhandled error: ${message}`,
    };
  }

  const elapsedMs = Date.now() - startMs;
  log(name, "runner", `finished in ${elapsedMs}ms`, result.summary);

  return result;
}

/**
 * CLI entrypoint: run a worker by name from argv.
 * Usage: node dist/runner.js <worker-name>
 */
async function main(): Promise<void> {
  const name = process.argv[2];

  if (!name) {
    console.error("Usage: node runner.js <worker-name>");
    console.error(
      "Available:",
      registry.map((w) => w.name).join(", ")
    );
    process.exit(1);
  }

  const result = await runWorker(name);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "error" ? 1 : 0);
}

main();
