import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import AsyncBoundary from "../components/AsyncBoundary";
import Card from "../components/Card";
import { relativeTime } from "../lib/format";
import type {
  WorkersResponse,
  Worker,
  WorkerStatus,
  TriggerResponse,
} from "../types";

type TriggerState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; message: string; at: number }
  | { kind: "error"; message: string; at: number };

export default function Workers() {
  const workers = useFetch<WorkersResponse>("/api/workers");
  const [triggers, setTriggers] = useState<Record<string, TriggerState>>({});

  const run = async (name: string) => {
    setTriggers((s) => ({ ...s, [name]: { kind: "running" } }));
    try {
      const res = await fetch(`/api/workers/${encodeURIComponent(name)}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await res.json()) as TriggerResponse | { error: string };
      if (!res.ok) {
        const msg = "error" in body ? body.error : `HTTP ${res.status}`;
        setTriggers((s) => ({
          ...s,
          [name]: { kind: "error", message: msg, at: Date.now() },
        }));
        return;
      }
      setTriggers((s) => ({
        ...s,
        [name]: {
          kind: "success",
          message: "message" in body ? body.message : "已触发",
          at: Date.now(),
        },
      }));
      workers.refetch();
    } catch (err) {
      setTriggers((s) => ({
        ...s,
        [name]: {
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
          at: Date.now(),
        },
      }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="状态监控 — 查看各 worker 运行状态"
        actions={
          <button
            onClick={workers.refetch}
            className="text-xs text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700 rounded-md px-3 py-1.5"
          >
            刷新
          </button>
        }
      />

      <AsyncBoundary
        loading={workers.loading}
        error={workers.error}
        empty={(workers.data?.workers.length ?? 0) === 0}
        emptyMessage="未发现 worker — 检查 packages/workers/ 目录"
        onRetry={workers.refetch}
        loadingLabel="加载 workers…"
      >
        <div data-testid="workers-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(workers.data?.workers ?? []).map((w) => (
            <WorkerCard
              key={w.name}
              worker={w}
              trigger={triggers[w.name] ?? { kind: "idle" }}
              onRun={() => run(w.name)}
            />
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function WorkerCard({
  worker,
  trigger,
  onRun,
}: {
  worker: Worker;
  trigger: TriggerState;
  onRun: () => void;
}) {
  const isRunning = trigger.kind === "running" || worker.status === "running";

  return (
    <Card testId="worker-card">
      <div data-worker-name={worker.name} className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 data-testid="worker-name" className="text-base font-semibold text-white">{worker.name}</h3>
            <StatusBadge status={worker.status} />
          </div>
          <p data-testid="worker-description" className="mt-1 text-sm text-gray-400">{worker.description}</p>
        </div>
        <button
          data-testid="worker-trigger"
          onClick={onRun}
          disabled={isRunning}
          className="shrink-0 rounded-md bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-200 text-xs px-3 py-1.5 border border-gray-700 disabled:border-gray-800 transition-colors"
        >
          {trigger.kind === "running" ? "运行中…" : "立即运行"}
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Meta label="调度">
          <code className="text-gray-300">{worker.schedule}</code>
        </Meta>
        <Meta label="上次运行">
          <span className="text-gray-300">{relativeTime(worker.lastRun)}</span>
        </Meta>
        <Meta label="上次结果">
          <span
            className={
              worker.lastResult === "success"
                ? "text-emerald-400"
                : worker.lastResult === "failure"
                  ? "text-red-400"
                  : "text-gray-500"
            }
          >
            {worker.lastResult ?? "—"}
          </span>
        </Meta>
        {worker.scriptPath ? (
          <Meta label="脚本">
            <code className="text-gray-500 text-[11px] truncate" title={worker.scriptPath}>
              {worker.scriptPath.split("/").slice(-2).join("/")}
            </code>
          </Meta>
        ) : null}
      </dl>

      {trigger.kind === "success" ? (
        <p data-testid="worker-feedback-success" className="mt-3 text-xs text-emerald-400">{trigger.message}</p>
      ) : null}
      {trigger.kind === "error" ? (
        <p data-testid="worker-feedback-error" className="mt-3 text-xs text-red-400">{trigger.message}</p>
      ) : null}
    </Card>
  );
}

function StatusBadge({ status }: { status: WorkerStatus }) {
  const styles: Record<WorkerStatus, string> = {
    idle: "bg-gray-800 text-gray-400",
    running: "bg-blue-900/40 text-blue-300 border border-blue-800/50",
    failed: "bg-red-900/40 text-red-300 border border-red-800/50",
    disabled: "bg-gray-900 text-gray-600 border border-gray-800",
  };
  const labels: Record<WorkerStatus, string> = {
    idle: "空闲",
    running: "运行中",
    failed: "失败",
    disabled: "已禁用",
  };
  return (
    <span data-testid="worker-status-badge" data-status={status} className={`text-[11px] px-2 py-0.5 rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-gray-600 uppercase tracking-wider text-[10px]">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
