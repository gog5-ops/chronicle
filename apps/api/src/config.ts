import path from "node:path";

export const config = {
  port: parseInt(process.env.HERMES_API_PORT || "3002", 10),

  /** Path to the wiki directory (truth source for chronicle, docs) */
  wikiPath: process.env.HERMES_WIKI_PATH || "/opt/opshub/wiki",

  /** Path to chronicle entries within the wiki */
  get chroniclePath() {
    return path.join(this.wikiPath, "chronicle");
  },

  /** Path to persistent data directory for hermes-specific state */
  dataPath: process.env.HERMES_DATA_PATH || "/opt/opshub/hermes-data",

  /** Path to worker scripts (legacy filesystem-scanned workers) */
  workersPath:
    process.env.HERMES_WORKERS_PATH || "/opt/opshub/hermes-data/workers",

  /** Path to the workers manifest produced by `pnpm --filter @hermes/workers build` */
  workersManifestPath:
    process.env.HERMES_WORKERS_MANIFEST_PATH ||
    "/home/sfanix/chronicle/packages/workers/dist/workers-manifest.json",

  /** Path to the workers runner CLI entrypoint */
  workersRunnerPath:
    process.env.HERMES_WORKERS_RUNNER_PATH ||
    "/home/sfanix/chronicle/packages/workers/dist/runner.js",

  /** Path to the JSONL log of worker run results (one JSON object per line) */
  workerRunsLogPath:
    process.env.HERMES_WORKER_RUNS_LOG_PATH ||
    "/opt/opshub/logs/worker-runs.jsonl",

  /** Path to audit reports */
  get auditPath() {
    return path.join(this.dataPath, "audit");
  },
} as const;
