import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import AsyncBoundary from "../components/AsyncBoundary";
import Timeline from "../components/Timeline";
import ChronicleEntryCard from "../components/ChronicleEntryCard";
import type { ChronicleResponse, Stats, ChronicleEntry } from "../types";

export default function Chronicle() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actor, setActor] = useState("");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (actor) params.set("actor", actor);
    const qs = params.toString();
    return qs ? `/api/chronicle?${qs}` : "/api/chronicle";
  }, [from, to, actor]);

  const chronicle = useFetch<ChronicleResponse>(url);
  const stats = useFetch<Stats>("/api/stats");

  const groups = useMemo(() => {
    const entries = chronicle.data?.entries ?? [];
    const byDate = new Map<string, ChronicleEntry[]>();
    for (const entry of entries) {
      const arr = byDate.get(entry.date) ?? [];
      arr.push(entry);
      byDate.set(entry.date, arr);
    }
    return Array.from(byDate.entries()).map(([date, items]) => ({
      key: date,
      label: date,
      items: items.map((entry) => (
        <ChronicleEntryCard key={entry.id} entry={entry} />
      )),
    }));
  }, [chronicle.data]);

  const reset = () => {
    setFrom("");
    setTo("");
    setActor("");
  };

  return (
    <div>
      <PageHeader
        title="Chronicle"
        subtitle="编年体 — 按时间线查看所有任务记录"
      />

      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/60 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="起始日期">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
            />
          </Field>
          <Field label="结束日期">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
            />
          </Field>
          <Field label="执行者">
            <select
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-gray-600 min-w-[140px]"
            >
              <option value="">全部</option>
              {(stats.data?.actors ?? []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          {(from || to || actor) && (
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1.5"
            >
              清除筛选
            </button>
          )}
          <div className="ml-auto text-xs text-gray-500">
            {chronicle.data ? `共 ${chronicle.data.count} 条` : null}
          </div>
        </div>
      </div>

      <AsyncBoundary
        loading={chronicle.loading}
        error={chronicle.error}
        empty={groups.length === 0}
        emptyMessage="无符合条件的条目"
        onRetry={chronicle.refetch}
        loadingLabel="加载编年体…"
      >
        <Timeline groups={groups} />
      </AsyncBoundary>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}
