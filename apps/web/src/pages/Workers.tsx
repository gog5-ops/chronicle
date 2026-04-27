export default function Workers() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Workers</h2>
      <p className="text-sm text-gray-500 mb-8">状态监控 -- 查看各 worker 运行状态</p>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-600">
          暂无 worker 数据 -- 连接 API 后将在此展示 worker 状态
        </p>
      </div>
    </div>
  );
}
