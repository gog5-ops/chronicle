export default function Audit() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Audit</h2>
      <p className="text-sm text-gray-500 mb-8">审计报告 -- 安全与操作审计日志</p>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-600">
          暂无审计记录 -- 连接 API 后将在此展示审计日志
        </p>
      </div>
    </div>
  );
}
