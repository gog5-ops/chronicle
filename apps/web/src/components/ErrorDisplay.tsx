interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-300">加载失败</p>
          <p className="mt-1 text-xs text-red-400/80 break-all">{message}</p>
        </div>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-md border border-red-800/60 bg-red-900/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-900/50 transition-colors"
          >
            重试
          </button>
        ) : null}
      </div>
    </div>
  );
}
