export interface ChronicleEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM UTC (or HH:MM) */
  time: string;
  /** Who performed the action (e.g., Claude, Hermes) */
  actor: string;
  /** Entry title from the ### heading */
  title: string;
  /** Related issue identifier (e.g., opshub#78) */
  issue?: string;
  /** Summary of what was done (from **做了什么** field) */
  summary: string;
  /** Key findings (from **关键发现** field) */
  findings?: string[];
  /** Artifacts produced (from **产出** field) */
  artifacts?: string[];
  /** Error paths / dead ends encountered (from **错误路径** field) */
  errorPaths?: string[];
  /** Raw markdown block for this entry, including its ### heading */
  raw: string;
}

export type WorkerStatus = "idle" | "running" | "failed" | "disabled";

export interface Worker {
  name: string;
  description: string;
  /** Cron expression or "manual" / "event" */
  schedule: string;
  status: WorkerStatus;
  enabled: boolean;
  lastRun?: string;
  lastResult?: "success" | "failure";
  scriptPath?: string;
}

export interface WorkerRunRecord {
  timestamp: string;
  name: string;
  result: {
    status: "ok" | "error" | "warn";
    summary: string;
    details?: Record<string, unknown>;
  };
  durationMs: number;
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
