import { Router, type Request, type Response } from "express";
import { loadEntries } from "./chronicle.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const entries = await loadEntries();
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const entriesThisMonth = entries.filter((e) => e.date.startsWith(ym)).length;
  const actors = new Set(entries.map((e) => e.actor));

  res.json({
    totalEntries: entries.length,
    entriesThisMonth,
    uniqueActors: actors.size,
    actors: [...actors].sort(),
    currentMonth: ym,
  });
});

export default router;
