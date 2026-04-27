export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-8">系统概览</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="编年体条目" value="--" sub="chronicle entries" />
        <StatCard title="活跃 Workers" value="--" sub="active workers" />
        <StatCard title="审计事件 (24h)" value="--" sub="audit events" />
      </div>

      <div className="mt-10 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">最近活动</h3>
        <p className="text-sm text-gray-600">暂无数据 -- 连接 API 后显示</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-600">{sub}</p>
    </div>
  );
}
