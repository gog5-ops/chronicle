export interface ChronicleEntry {
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Who performed the action */
  actor: string;
  /** What was done */
  action: string;
  /** Related issue URL or number */
  issue?: string;
  /** Output artifacts (file paths, URLs) */
  artifacts?: string[];
  /** Error paths or dead ends encountered */
  errorPaths?: string[];
  /** Free-form notes */
  notes?: string;
}

export type WorkerStatus = "idle" | "running" | "failed" | "disabled";

export interface Worker {
  name: string;
  description: string;
  /** Cron expression */
  schedule: string;
  status: WorkerStatus;
  lastRun?: string;
  lastResult?: "success" | "failure";
  scriptPath: string;
}

export interface WorkerLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface AuditReport {
  id: string;
  /** ISO 8601 timestamp of when the audit ran */
  timestamp: string;
  /** What was audited */
  scope: string;
  /** Summary of findings */
  summary: string;
  /** Number of issues found */
  issueCount: number;
  /** Detailed findings */
  findings: AuditFinding[];
}

export interface AuditFinding {
  severity: "info" | "warning" | "error";
  category: string;
  message: string;
  /** File path or resource that triggered the finding */
  source?: string;
}
