import { Router, type Request, type Response } from "express";
import fs from "node:fs/promises";

const router = Router();

const OPS_LOG_PATH = "/opt/opshub/logs/ops.log";
const DEFAULT_LINES = 100;
const MAX_LINES = 5000;

router.get("/", async (req: Request, res: Response) => {
  const requested = parseInt((req.query.lines as string) || "", 10);
  const limit =
    Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_LINES)
      : DEFAULT_LINES;

  try {
    const content = await fs.readFile(OPS_LOG_PATH, "utf-8");
    const allLines = content.split("\n");
    const trailing =
      allLines[allLines.length - 1] === "" ? allLines.slice(0, -1) : allLines;
    const lines = trailing.slice(-limit);
    res.json({
      path: OPS_LOG_PATH,
      lines,
      count: lines.length,
      requested: limit,
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      res.status(404).json({
        error: "ops.log not found",
        path: OPS_LOG_PATH,
      });
      return;
    }
    res.status(500).json({
      error: "Failed to read ops.log",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
