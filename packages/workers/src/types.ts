export interface WorkerResult {
  status: "ok" | "error" | "warn";
  summary: string;
  details?: Record<string, unknown>;
}

export interface WorkerDefinition {
  /** Unique name used for invocation and logging */
  name: string;
  /** Human-readable description of what this worker does */
  description: string;
  /** Cron schedule expression (e.g. "*/15 * * * *") or "event" for trigger-based */
  schedule: string;
  /** Whether this worker is active */
  enabled: boolean;
  /** The actual work. Returns a result object. Must not throw. */
  run: () => Promise<WorkerResult>;
}
