import { cn } from "@/lib/utils";
import type { MarketTrend } from "@/types";

interface TrendIndicatorProps {
  trend: MarketTrend;
  value?: number;
  showLabel?: boolean;
  className?: string;
}

export function TrendIndicator({
  trend,
  value,
  showLabel = false,
  className,
}: TrendIndicatorProps) {
  const config = {
    rising: {
      icon: "↑",
      color: "var(--color-positive)",
      bg: "rgba(16, 185, 129, 0.1)",
      label: "Rising",
    },
    falling: {
      icon: "↓",
      color: "var(--color-danger)",
      bg: "rgba(239, 68, 68, 0.1)",
      label: "Falling",
    },
    stable: {
      icon: "→",
      color: "var(--color-text-dim)",
      bg: "rgba(100, 116, 139, 0.1)",
      label: "Stable",
    },
    volatile: {
      icon: "↕",
      color: "var(--color-warning)",
      bg: "rgba(245, 158, 11, 0.1)",
      label: "Volatile",
    },
  }[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5",
        className
      )}
      style={{
        color: config.color,
        background: config.bg,
        fontFamily: "var(--font-mono)",
      }}
    >
      <span>{config.icon}</span>
      {value !== undefined && (
        <span>
          {value > 0 ? "+" : ""}
          {value}
        </span>
      )}
      {showLabel && (
        <span style={{ fontFamily: "var(--font-sans)" }}>{config.label}</span>
      )}
    </span>
  );
}
