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

  /** Path to worker scripts */
  workersPath:
    process.env.HERMES_WORKERS_PATH || "/opt/opshub/hermes-data/workers",

  /** Path to audit reports */
  get auditPath() {
    return path.join(this.dataPath, "audit");
  },
} as const;
