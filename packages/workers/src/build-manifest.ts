import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { registry } from "./registry.js";

interface ManifestEntry {
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
}

const entries: ManifestEntry[] = registry.map((w) => ({
  name: w.name,
  description: w.description,
  schedule: w.schedule,
  enabled: w.enabled,
}));

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "workers-manifest.json");

writeFileSync(out, JSON.stringify({ workers: entries }, null, 2) + "\n", "utf-8");

console.log(`[build-manifest] wrote ${entries.length} workers to ${out}`);
