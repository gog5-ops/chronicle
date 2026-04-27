interface SpinnerProps {
  label?: string;
  size?: "sm" | "md";
}

export default function Spinner({ label = "加载中…", size = "md" }: SpinnerProps) {
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex items-center gap-3 text-sm text-gray-500">
      <svg
        className={`animate-spin ${dim} text-gray-400`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}
