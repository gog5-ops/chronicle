import { Router, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import type { ChronicleEntry } from "../types.js";

const router = Router();

// Zod schema for creating a chronicle entry
const CreateEntrySchema = z.object({
  actor: z.string().min(1),
  action: z.string().min(1),
  issue: z.string().optional(),
  artifacts: z.array(z.string()).optional(),
  errorPaths: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Load chronicle entries from the filesystem.
 * Each .md file in the chronicle directory is parsed as an entry.
 * Falls back to in-memory store if filesystem is unavailable.
 */
const inMemoryEntries: ChronicleEntry[] = [];

async function loadEntries(): Promise<ChronicleEntry[]> {
  try {
    const chroniclePath = config.chroniclePath;
    const files = await fs.readdir(chroniclePath);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    const entries: ChronicleEntry[] = [];
    for (const file of mdFiles) {
      const content = await fs.readFile(
        path.join(chroniclePath, file),
        "utf-8"
      );
      const entry = parseChronicleFile(file, content);
      if (entry) entries.push(entry);
    }
    return entries;
  } catch {
    // Filesystem unavailable, use in-memory store
    return inMemoryEntries;
  }
}

/**
 * Parse a chronicle markdown file into a ChronicleEntry.
 * Expected format: YAML-ish frontmatter or structured markdown.
 * Gracefully handles free-form files by using filename as ID.
 */
function parseChronicleFile(
  filename: string,
  content: string
): ChronicleEntry | null {
  const id = filename.replace(/\.md$/, "");
  const lines = content.split("\n");

  // Try to extract structured data from the file
  let actor = "unknown";
  let action = "";
  let timestamp = "";
  let issue: string | undefined;
  let notes = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      action = trimmed.slice(2);
    } else if (trimmed.match(/^(who|actor):/i)) {
      actor = trimmed.split(":").slice(1).join(":").trim();
    } else if (trimmed.match(/^(when|date|timestamp):/i)) {
      timestamp = trimmed.split(":").slice(1).join(":").trim();
    } else if (trimmed.match(/^(issue|ref):/i)) {
      issue = trimmed.split(":").slice(1).join(":").trim();
    }
  }

  // If no structured heading, use first non-empty line as action
  if (!action) {
    action = lines.find((l) => l.trim().length > 0)?.trim() || filename;
  }

  // Use filename date if no explicit timestamp (format: YYYY-MM-DD-slug.md)
  if (!timestamp) {
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      timestamp = dateMatch[1];
    } else {
      timestamp = new Date().toISOString();
    }
  }

  notes = content;

  return { id, timestamp, actor, action, issue, notes };
}

// GET /api/chronicle — list entries with optional date filter
router.get("/", async (_req: Request, res: Response) => {
  const entries = await loadEntries();

  const { from, to, actor } = _req.query;

  let filtered = entries;

  if (typeof from === "string") {
    filtered = filtered.filter((e) => e.timestamp >= from);
  }
  if (typeof to === "string") {
    filtered = filtered.filter((e) => e.timestamp <= to);
  }
  if (typeof actor === "string") {
    filtered = filtered.filter(
      (e) => e.actor.toLowerCase() === actor.toLowerCase()
    );
  }

  // Return newest first
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  res.json({ entries: filtered, count: filtered.length });
});

// GET /api/chronicle/:id — get single entry
router.get("/:id", async (req: Request, res: Response) => {
  const entries = await loadEntries();
  const entry = entries.find((e) => e.id === req.params.id);

  if (!entry) {
    res.status(404).json({ error: "Chronicle entry not found" });
    return;
  }

  res.json(entry);
});

// POST /api/chronicle — create entry
router.post("/", async (req: Request, res: Response) => {
  const parsed = CreateEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const now = new Date();
  const id = `${now.toISOString().slice(0, 10)}-${Date.now()}`;

  const entry: ChronicleEntry = {
    id,
    timestamp: now.toISOString(),
    actor: data.actor,
    action: data.action,
    issue: data.issue,
    artifacts: data.artifacts,
    errorPaths: data.errorPaths,
    notes: data.notes,
  };

  // Try to write to filesystem, fall back to in-memory
  try {
    const chroniclePath = config.chroniclePath;
    await fs.mkdir(chroniclePath, { recursive: true });

    const content = [
      `# ${entry.action}`,
      "",
      `who: ${entry.actor}`,
      `when: ${entry.timestamp}`,
      entry.issue ? `issue: ${entry.issue}` : null,
      "",
      entry.notes || "",
      entry.artifacts?.length
        ? `\n## Artifacts\n${entry.artifacts.map((a) => `- ${a}`).join("\n")}`
        : null,
      entry.errorPaths?.length
        ? `\n## Error Paths\n${entry.errorPaths.map((e) => `- ${e}`).join("\n")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    await fs.writeFile(path.join(chroniclePath, `${id}.md`), content, "utf-8");
  } catch {
    // Fall back to in-memory
    inMemoryEntries.push(entry);
  }

  res.status(201).json(entry);
});

export default router;
