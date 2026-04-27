import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import AsyncBoundary from "../components/AsyncBoundary";
import Card from "../components/Card";
import { formatDateTime } from "../lib/format";
import type {
  AuditResponse,
  AuditReportSummary,
  AuditReport,
  AuditFinding,
} from "../types";

export default function Audit() {
  const list = useFetch<AuditResponse>("/api/audit");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Audit" subtitle="审计报告 — 安全与操作审计日志" />

      <AsyncBoundary
        loading={list.loading}
        error={list.error}
        empty={(list.data?.reports.length ?? 0) === 0}
        emptyMessage="暂无审计报告"
        onRetry={list.refetch}
        loadingLabel="加载审计报告…"
      >
        <div className="space-y-3">
          {(list.data?.reports ?? []).map((report) => (
            <AuditCard
              key={report.id}
              report={report}
              expanded={openId === report.id}
              onToggle={() =>
                setOpenId((id) => (id === report.id ? null : report.id))
              }
            />
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function AuditCard({
  report,
  expanded,
  onToggle,
}: {
  report: AuditReportSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detail = useFetch<AuditReport>(
    expanded ? `/api/audit/${encodeURIComponent(report.id)}` : null,
  );

  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full text-left flex items-start justify-between gap-3"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatDateTime(report.timestamp)}</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-400">{report.scope}</span>
          </div>
          <p className="mt-1 text-sm text-gray-200">{report.summary}</p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span
            className={`text-[11px] px-2 py-0.5 rounded ${
              report.findingCount > 0
                ? "bg-amber-900/40 text-amber-300 border border-amber-800/50"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            {report.findingCount} 项发现
          </span>
          <span className="text-xs text-gray-500">
            {expanded ? "收起" : "展开"}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-gray-800 pt-4">
          <AsyncBoundary
            loading={detail.loading}
            error={detail.error}
            empty={(detail.data?.findings.length ?? 0) === 0}
            emptyMessage="本报告无发现项"
            onRetry={detail.refetch}
            loadingLabel="加载详情…"
          >
            <ul className="space-y-2">
              {(detail.data?.findings ?? []).map((f, i) => (
                <FindingRow key={i} finding={f} />
              ))}
            </ul>
          </AsyncBoundary>
        </div>
      ) : null}
    </Card>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  const styles = {
    info: "border-gray-800 bg-gray-900/40 text-gray-400",
    warning: "border-amber-900/50 bg-amber-950/20 text-amber-300",
    error: "border-red-900/50 bg-red-950/20 text-red-300",
  } as const;
  return (
    <li className={`rounded border px-3 py-2 text-sm ${styles[finding.severity]}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
        <span>{finding.severity}</span>
        <span className="opacity-50">·</span>
        <span>{finding.category}</span>
      </div>
      <p className="mt-1 text-gray-200">{finding.message}</p>
      {finding.source ? (
        <p className="mt-0.5 text-xs text-gray-500 font-mono">{finding.source}</p>
      ) : null}
    </li>
  );
}
