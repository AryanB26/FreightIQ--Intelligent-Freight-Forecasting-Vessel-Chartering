"use client";

import { Panel, PanelHeader } from "@/components/design-system/primitives";
import { cn } from "@/lib/utils";

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  height?: string;
  className?: string;
}

export function ChartPlaceholder({
  title,
  description,
  height = "h-64",
  className,
}: ChartPlaceholderProps) {
  return (
    <Panel className={className}>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {description}
          </p>
        )}
      </PanelHeader>
      <div className="p-4">
        <div
          className={cn(
            "rounded-md flex items-center justify-center",
            height
          )}
          style={{
            background: "var(--color-bg)",
            border: "1px dashed var(--color-border)",
          }}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--color-text-dim)"
              strokeWidth={1.5}
              opacity={0.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p
              className="text-[11px]"
              style={{ color: "var(--color-text-dim)" }}
            >
              Chart: {title}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
