"use client";

import { cn } from "@/lib/utils";

/* =============================================
   PANEL — Raised dark surface container
   ============================================= */
export function Panel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

/* =============================================
   SECTION HEADER — Compact section title
   ============================================= */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("section-header", className)}>
      <div>
        <h3 className="section-title">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* =============================================
   DATA CELL — Compact metric display
   ============================================= */
export function DataCell({
  label,
  value,
  unit,
  trend,
  mono = true,
  size = "default",
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; direction: "up" | "down" | "flat"; color?: string };
  mono?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const trendColor = {
    up: "text-[var(--color-positive)]",
    down: "text-[var(--color-danger)]",
    flat: "text-[var(--color-text-muted)]",
  };

  return (
    <div className={cn("min-w-0", className)}>
      <p className="data-label">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className={cn(
            size === "lg" ? "text-[22px]" : size === "sm" ? "text-[13px]" : "text-[16px]",
            "font-bold leading-tight",
            mono ? "font-[var(--font-mono)]" : ""
          )}
          style={mono ? { fontFamily: "var(--font-mono)" } : undefined}
        >
          {value}
        </span>
        {unit && <span className="data-unit">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={cn(
              "text-[10px] font-medium",
              trend.color || trendColor[trend.direction]
            )}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}

/* =============================================
   STATUS DOT
   ============================================= */
export function StatusDot({
  status,
  className,
}: {
  status: "green" | "amber" | "red" | "cyan";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "status-dot",
        {
          "status-dot-green": status === "green",
          "status-dot-amber": status === "amber",
          "status-dot-red": status === "red",
          "status-dot-cyan": status === "cyan",
        },
        className
      )}
    />
  );
}

/* =============================================
   TAG — Compact labels
   ============================================= */
export function Tag({
  children,
  variant = "cyan",
  className,
}: {
  children: React.ReactNode;
  variant?: "cyan" | "green" | "amber" | "red" | "violet" | "blue" | "default";
  className?: string;
}) {
  const variantClass = {
    cyan: "tag-cyan",
    green: "tag-green",
    amber: "tag-amber",
    red: "tag-red",
    violet: "tag-violet",
    blue: "tag-blue",
    default: "text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
  };
  return <span className={cn("tag", variantClass[variant], className)}>{children}</span>;
}

/* =============================================
   RISK BADGE — Severity indicator
   ============================================= */
export function RiskBadge({
  level,
  className,
}: {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  className?: string;
}) {
  const styles = {
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
        styles[level],
        className
      )}
    >
      <StatusDot
        status={
          level === "LOW" ? "green" : level === "MEDIUM" ? "amber" : "red"
        }
      />
      {level}
    </span>
  );
}

/* =============================================
   EMPTY STATE
   ============================================= */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        {title}
      </p>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* =============================================
   COMPACT CARD — for KPI grids
   ============================================= */
export function CompactCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("kpi-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* =============================================
   DATA MODE BADGE
   ============================================= */
export function DataModeBadge({ mode = "SIMULATED" }: { mode?: string }) {
  return null;
}

/* =============================================
   PROGRESS STEPS — for analysis pipeline
   ============================================= */
export function ProgressStep({
  label,
  status,
}: {
  label: string;
  status: "complete" | "running" | "pending" | "failed";
}) {
  const icons = {
    complete: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    running: (
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-cyan)] animate-[pulse-subtle_1.5s_ease-in-out_infinite]" />
    ),
    pending: (
      <span className="h-2.5 w-2.5 rounded-full border border-[var(--color-text-dim)]" />
    ),
    failed: (
      <svg className="w-3 h-3 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  const colors = {
    complete: "text-[var(--color-positive)]",
    running: "text-[var(--color-cyan)]",
    pending: "text-[var(--color-text-dim)]",
    failed: "text-[var(--color-danger)]",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("flex items-center justify-center w-4", colors[status])}>
        {icons[status]}
      </span>
      <span
        className={cn(
          "text-xs",
          status === "complete" && "text-[var(--color-text-secondary)]",
          status === "running" && "text-[var(--color-cyan)] font-medium",
          status === "pending" && "text-[var(--color-text-dim)]",
          status === "failed" && "text-[var(--color-danger)]"
        )}
      >
        {label}
      </span>
    </div>
  );
}
