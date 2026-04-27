import { Router, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { AuditReport } from "../types.js";

const router = Router();

/**
 * Load audit reports from the filesystem.
 * Each .json file in the audit directory is a report.
 */
async function loadReports(): Promise<AuditReport[]> {
  try {
    const auditPath = config.auditPath;
    const files = await fs.readdir(auditPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

    const reports: AuditReport[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(
          path.join(auditPath, file),
          "utf-8"
        );
        const report = JSON.parse(content) as AuditReport;
        // Use filename as fallback ID
        if (!report.id) {
          report.id = file.replace(/\.json$/, "");
        }
        reports.push(report);
      } catch {
        // Skip malformed files
      }
    }

    return reports;
  } catch {
    return [];
  }
}

// GET /api/audit — list audit reports
router.get("/", async (_req: Request, res: Response) => {
  const reports = await loadReports();

  const { scope, from, to } = _req.query;

  let filtered = reports;

  if (typeof scope === "string") {
    filtered = filtered.filter(
      (r) => r.scope.toLowerCase() === scope.toLowerCase()
    );
  }
  if (typeof from === "string") {
    filtered = filtered.filter((r) => r.timestamp >= from);
  }
  if (typeof to === "string") {
    filtered = filtered.filter((r) => r.timestamp <= to);
  }

  // Newest first
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Return summary (without full findings) for list view
  const summaries = filtered.map(({ findings, ...rest }) => ({
    ...rest,
    findingCount: findings?.length || 0,
  }));

  res.json({ reports: summaries, count: summaries.length });
});

// GET /api/audit/:id — get single report (with full findings)
router.get("/:id", async (req: Request, res: Response) => {
  const reports = await loadReports();
  const report = reports.find((r) => r.id === req.params.id);

  if (!report) {
    res.status(404).json({ error: "Audit report not found" });
    return;
  }

  res.json(report);
});

export default router;
