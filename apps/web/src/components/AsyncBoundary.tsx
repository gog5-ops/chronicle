import type { ReactNode } from "react";
import Spinner from "./Spinner";
import ErrorDisplay from "./ErrorDisplay";

interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  loadingLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export default function AsyncBoundary({
  loading,
  error,
  empty,
  emptyMessage = "暂无数据",
  loadingLabel,
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (loading) return <Spinner label={loadingLabel} />;
  if (error) return <ErrorDisplay message={error} onRetry={onRetry} />;
  if (empty) {
    return <p className="text-sm text-gray-600">{emptyMessage}</p>;
  }
  return <>{children}</>;
}
