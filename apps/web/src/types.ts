export interface ChronicleEntry {
  id: string;
  date: string;
  time: string;
  actor: string;
  title: string;
  issue?: string;
  summary: string;
  findings?: string[];
  artifacts?: string[];
  errorPaths?: string[];
  raw: string;
}

export interface ChronicleResponse {
  entries: ChronicleEntry[];
  count: number;
}

export interface Stats {
  totalEntries: number;
  entriesThisMonth: number;
  uniqueActors: number;
  actors: string[];
  currentMonth: string;
}

export interface HealthLive {
  status: "ok" | "degraded";
  timestamp: string;
  tmuxAvailable: boolean;
  sessions: { slack: boolean; telegram: boolean; hermes: boolean };
}

export interface OpsLog {
  path: string;
  lines: string[];
  count: number;
  requested: number;
}

export type WorkerStatus = "idle" | "running" | "failed" | "disabled";

export interface Worker {
  name: string;
  description: string;
  schedule: string;
  status: WorkerStatus;
  lastRun?: string;
  lastResult?: "success" | "failure";
  scriptPath: string;
}

export interface WorkersResponse {
  workers: Worker[];
  count: number;
}

export interface TriggerResponse {
  message: string;
  startedAt: string;
  scriptPath: string;
}

export interface AuditFinding {
  severity: "info" | "warning" | "error";
  category: string;
  message: string;
  source?: string;
}

export interface AuditReportSummary {
  id: string;
  timestamp: string;
  scope: string;
  summary: string;
  issueCount: number;
  findingCount: number;
}

export interface AuditReport {
  id: string;
  timestamp: string;
  scope: string;
  summary: string;
  issueCount: number;
  findings: AuditFinding[];
}

export interface AuditResponse {
  reports: AuditReportSummary[];
  count: number;
}
