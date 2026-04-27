export default function Chronicle() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Chronicle</h2>
      <p className="text-sm text-gray-500 mb-8">编年体 -- 按时间线查看所有任务记录</p>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-600">
          暂无条目 -- 连接 API 后将在此展示编年体时间线
        </p>
      </div>
    </div>
  );
}
