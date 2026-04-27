import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OPS_LOG = "/opt/opshub/logs/ops.log";

/**
 * Append a structured line to ops.log.
 * Format: ISO_TIMESTAMP [worker-name] [context] message → result
 */
export function log(
  workerName: string,
  context: string,
  message: string,
  result?: string
): void {
  const timestamp = new Date().toISOString();
  const suffix = result ? ` → ${result}` : "";
  const line = `${timestamp} [${workerName}] [${context}] ${message}${suffix}\n`;

  try {
    mkdirSync(dirname(OPS_LOG), { recursive: true });
    appendFileSync(OPS_LOG, line);
  } catch (err) {
    // Fallback to stderr if ops.log is not writable
    process.stderr.write(`[logger-fallback] ${line}`);
    process.stderr.write(
      `[logger-fallback] write failed: ${err instanceof Error ? err.message : String(err)}\n`
    );
  }
}
