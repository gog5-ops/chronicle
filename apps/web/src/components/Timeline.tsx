import type { ReactNode } from "react";

export interface TimelineGroup {
  key: string;
  label: string;
  items: ReactNode[];
}

interface TimelineProps {
  groups: TimelineGroup[];
}

export default function Timeline({ groups }: TimelineProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            {group.label}
          </h3>
          <div className="space-y-2 border-l border-gray-800 pl-5">
            {group.items.map((item, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[27px] top-3 h-2 w-2 rounded-full bg-gray-700 ring-4 ring-gray-950" />
                {item}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
