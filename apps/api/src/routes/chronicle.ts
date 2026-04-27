import { Router, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { ChronicleEntry } from "../types.js";

const router = Router();

const ENTRY_HEADER_RE =
  /^###\s+(\d{1,2}:\d{2}(?:\s+\S+)?)\s*—\s*([^:]+?):\s*(.+?)\s*$/;
const DATE_HEADER_RE = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/;
const SECTION_RE = /^-\s+\*\*([^*]+)\*\*:\s*(.*)$/;
const SUB_BULLET_RE = /^\s+-\s+(.*)$/;

/**
 * Load all chronicle entries from monthly markdown files in the wiki.
 * Each file (e.g. 2026-04.md) contains multiple entries grouped under
 * `## YYYY-MM-DD` date headings, with each `### HH:MM UTC — Actor: Title`
 * heading delimiting an individual entry.
 */
export async function loadEntries(): Promise<ChronicleEntry[]> {
  let files: string[];
  try {
    files = await fs.readdir(config.chroniclePath);
  } catch {
    return [];
  }

  const monthly = files
    .filter((f) => /^\d{4}-\d{2}\.md$/.test(f))
    .sort();

  const entries: ChronicleEntry[] = [];
  for (const file of monthly) {
    const content = await fs.readFile(
      path.join(config.chroniclePath, file),
      "utf-8"
    );
    entries.push(...parseMonthlyFile(content));
  }
  return entries;
}

export function parseMonthlyFile(content: string): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [];
  const lines = content.split("\n");

  let currentDate: string | null = null;
  let currentHeader: string | null = null;
  let currentBody: string[] = [];
  const idCounts = new Map<string, number>();

  function flush() {
    if (!currentDate || !currentHeader) return;
    const entry = parseEntry(currentDate, currentHeader, currentBody);
    if (entry) {
      const seen = idCounts.get(entry.id) ?? 0;
      if (seen > 0) entry.id = `${entry.id}-${seen + 1}`;
      idCounts.set(entry.id.replace(/-\d+$/, ""), seen + 1);
      entries.push(entry);
    }
    currentHeader = null;
    currentBody = [];
  }

  for (const line of lines) {
    const dateMatch = line.match(DATE_HEADER_RE);
    if (dateMatch) {
      flush();
      currentDate = dateMatch[1];
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      currentHeader = line;
      continue;
    }
    if (currentHeader) currentBody.push(line);
  }
  flush();

  return entries;
}

function parseEntry(
  date: string,
  header: string,
  bodyLines: string[]
): ChronicleEntry | null {
  const m = header.match(ENTRY_HEADER_RE);
  if (!m) return null;
  const [, time, actor, title] = m;

  const sections: Record<string, string[]> = {};
  let currentKey: string | null = null;

  for (const line of bodyLines) {
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      currentKey = sectionMatch[1].trim();
      const value = sectionMatch[2].trim();
      sections[currentKey] = sections[currentKey] ?? [];
      if (value) sections[currentKey].push(value);
      continue;
    }
    const subMatch = line.match(SUB_BULLET_RE);
    if (subMatch && currentKey) {
      sections[currentKey].push(subMatch[1].trim());
    }
  }

  const issue = sections["Issue"]?.[0];
  const summary = sections["做了什么"]?.join(" ") ?? "";
  const findings = sections["关键发现"];
  const artifacts = sections["产出"];
  const errorPaths = sections["错误路径"];

  const timeId = time.trim().replace(/[:\s]+/g, "-").toLowerCase();
  const id = `${date}-${timeId}`;

  const raw = [header, ...bodyLines].join("\n").trimEnd();

  return {
    id,
    date,
    time: time.trim(),
    actor: actor.trim(),
    title: title.trim(),
    issue,
    summary,
    findings,
    artifacts,
    errorPaths,
    raw,
  };
}

router.get("/", async (req: Request, res: Response) => {
  const entries = await loadEntries();
  const { from, to, actor } = req.query;

  let filtered = entries;
  if (typeof from === "string") {
    filtered = filtered.filter((e) => e.date >= from);
  }
  if (typeof to === "string") {
    filtered = filtered.filter((e) => e.date <= to);
  }
  if (typeof actor === "string") {
    filtered = filtered.filter(
      (e) => e.actor.toLowerCase() === actor.toLowerCase()
    );
  }

  filtered.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    return dateCmp !== 0 ? dateCmp : b.time.localeCompare(a.time);
  });

  res.json({ entries: filtered, count: filtered.length });
});

router.get("/:id", async (req: Request, res: Response) => {
  const entries = await loadEntries();
  const entry = entries.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Chronicle entry not found" });
    return;
  }
  res.json(entry);
});

export default router;
