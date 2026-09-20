import { cn } from "@/lib/utils";
import type { RiskEvent } from "@/types";

interface AlertBannerProps {
  risk: RiskEvent;
}

const severityConfig: Record<string, { border: string; bg: string; icon: string; iconColor: string }> = {
  info: {
    border: "var(--color-blue)",
    bg: "rgba(59, 130, 246, 0.06)",
    icon: "ℹ",
    iconColor: "var(--color-blue)",
  },
  warning: {
    border: "var(--color-warning)",
    bg: "rgba(245, 158, 11, 0.06)",
    icon: "⚠",
    iconColor: "var(--color-warning)",
  },
  critical: {
    border: "var(--color-danger)",
    bg: "rgba(239, 68, 68, 0.06)",
    icon: "✕",
    iconColor: "var(--color-danger)",
  },
};

export function AlertBanner({ risk }: AlertBannerProps) {
  const config = severityConfig[risk.severity] || severityConfig.info;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-md"
      style={{
        background: config.bg,
        borderLeft: `3px solid ${config.border}`,
      }}
    >
      <span
        className="text-sm shrink-0 mt-0.5"
        style={{ color: config.iconColor }}
      >
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[12px] font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {risk.title}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {risk.description}
        </p>
      </div>
    </div>
  );
}
