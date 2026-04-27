import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gray-900 p-5 ${className}`}
    >
      {title ? (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
