import { useState } from "react";
import type { ChronicleEntry } from "../types";
import { issueLink } from "../lib/format";

interface Props {
  entry: ChronicleEntry;
  defaultExpanded?: boolean;
  compact?: boolean;
}

export default function ChronicleEntryCard({
  entry,
  defaultExpanded = false,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const link = issueLink(entry.issue);
  const hasDetails =
    entry.summary ||
    (entry.findings && entry.findings.length > 0) ||
    (entry.artifacts && entry.artifacts.length > 0) ||
    (entry.errorPaths && entry.errorPaths.length > 0);

  return (
    <article
      className={`rounded-md border border-gray-800 bg-gray-900/60 ${
        compact ? "p-3" : "p-4"
      } hover:border-gray-700 transition-colors`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span className="font-mono">{entry.time}</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-400">{entry.actor}</span>
            {link ? (
              <>
                <span className="text-gray-700">·</span>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {link.label}
                </a>
              </>
            ) : null}
          </div>
          <h4
            className={`mt-1 font-medium text-gray-100 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {entry.title}
          </h4>
        </div>
        {hasDetails ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-xs text-gray-500 hover:text-gray-300"
            aria-expanded={expanded}
          >
            {expanded ? "收起" : "展开"}
          </button>
        ) : null}
      </header>

      {expanded && hasDetails ? (
        <div className="mt-3 space-y-3 border-t border-gray-800 pt-3 text-sm">
          {entry.summary ? (
            <Section label="做了什么">
              <p className="text-gray-300 whitespace-pre-wrap">
                {entry.summary}
              </p>
            </Section>
          ) : null}
          {entry.findings && entry.findings.length > 0 ? (
            <Section label="关键发现">
              <BulletList items={entry.findings} />
            </Section>
          ) : null}
          {entry.artifacts && entry.artifacts.length > 0 ? (
            <Section label="产出">
              <BulletList items={entry.artifacts} />
            </Section>
          ) : null}
          {entry.errorPaths && entry.errorPaths.length > 0 ? (
            <Section label="错误路径" tone="warn">
              <BulletList items={entry.errorPaths} />
            </Section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Section({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "warn";
}) {
  const labelColor = tone === "warn" ? "text-amber-400/90" : "text-gray-500";
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider mb-1 ${labelColor}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside ml-5 space-y-1 text-gray-300">
      {items.map((item, i) => (
        <li key={i} className="whitespace-pre-wrap">
          {item}
        </li>
      ))}
    </ul>
  );
}
