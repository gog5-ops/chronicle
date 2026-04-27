import type { WorkerDefinition } from "./types.js";
import { healthCheck } from "./workers/health-check.js";
import { chronicleAppend } from "./workers/chronicle-append.js";
import { issueSync } from "./workers/issue-sync.js";
import { truthVerify } from "./workers/truth-verify.js";

export const registry: WorkerDefinition[] = [
  healthCheck,
  chronicleAppend,
  issueSync,
  truthVerify,
];
