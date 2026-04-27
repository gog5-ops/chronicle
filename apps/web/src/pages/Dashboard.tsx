import { useFetch } from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import AsyncBoundary from "../components/AsyncBoundary";
import ChronicleEntryCard from "../components/ChronicleEntryCard";
import type {
  Stats,
  ChronicleResponse,
  HealthLive,
  WorkersResponse,
} from "../types";

export default function Dashboard() {
  const stats = useFetch<Stats>("/api/stats");
  const recent = useFetch<ChronicleResponse>("/api/chronicle");
  const health = useFetch<HealthLive>("/api/health/live");
  const workers = useFetch<WorkersResponse>("/api/workers");

  const recentEntries = recent.data?.entries.slice(0, 5) ?? [];
  const activeWorkers =
    workers.data?.workers.filter((w) => w.status !== "disabled").length ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="系统概览" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="编年体条目"
          value={stats.data ? String(stats.data.totalEntries) : "—"}
          sub={
            stats.data
              ? `本月 ${stats.data.entriesThisMonth} · ${stats.data.currentMonth}`
              : "chronicle entries"
          }
          loading={stats.loading}
          error={stats.error}
        />
        <StatCard
          title="活跃 Workers"
          value={workers.data ? String(activeWorkers) : "—"}
          sub={
            workers.data
              ? `共 ${workers.data.count} 个 worker`
              : "active workers"
          }
          loading={workers.loading}
          error={workers.error}
        />
        <StatCard
          title="独立 Actor"
          value={stats.data ? String(stats.data.uniqueActors) : "—"}
          sub={stats.data ? stats.data.actors.join(" · ") : "unique actors"}
          loading={stats.loading}
          error={stats.error}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          className="lg:col-span-2"
          title="最近活动"
          subtitle="最新 5 条编年体记录"
        >
          <AsyncBoundary
            loading={recent.loading}
            error={recent.error}
            empty={recentEntries.length === 0}
            emptyMessage="暂无编年体条目"
            onRetry={recent.refetch}
            loadingLabel="加载编年体…"
          >
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.id}>
                  <p className="mb-1 text-xs text-gray-500 font-mono">
                    {entry.date}
                  </p>
                  <ChronicleEntryCard entry={entry} compact />
                </div>
              ))}
            </div>
          </AsyncBoundary>
        </Card>

        <Card title="服务健康" subtitle="tmux session 状态">
          <AsyncBoundary
            loading={health.loading}
            error={health.error}
            onRetry={health.refetch}
            loadingLabel="检测中…"
          >
            {health.data ? (
              <HealthPanel health={health.data} />
            ) : null}
          </AsyncBoundary>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  loading,
  error,
}: {
  title: string;
  value: string;
  sub: string;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">
        {error ? "!" : loading ? "…" : value}
      </p>
      <p className="mt-1 text-xs text-gray-600 truncate" title={sub}>
        {error ? error : sub}
      </p>
    </div>
  );
}

function HealthPanel({ health }: { health: HealthLive }) {
  const dotColor = health.status === "ok" ? "bg-emerald-500" : "bg-amber-500";
  const labels: Record<keyof HealthLive["sessions"], string> = {
    slack: "Slack",
    telegram: "Telegram",
    hermes: "Hermes",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-sm text-gray-300">
          {health.status === "ok" ? "全部正常" : "存在异常"}
        </span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {(Object.keys(labels) as (keyof HealthLive["sessions"])[]).map((k) => (
          <li key={k} className="flex items-center justify-between">
            <span className="text-gray-400">{labels[k]}</span>
            <span
              className={
                health.sessions[k]
                  ? "text-emerald-400 text-xs"
                  : "text-red-400 text-xs"
              }
            >
              {health.sessions[k] ? "● running" : "○ down"}
            </span>
          </li>
        ))}
      </ul>
      {!health.tmuxAvailable ? (
        <p className="text-xs text-amber-400/80">tmux 未安装或不可访问</p>
      ) : null}
    </div>
  );
}
