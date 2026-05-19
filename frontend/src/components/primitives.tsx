"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  SEVERITY,
  DECISION,
  STATUSES,
  CATEGORIES,
  KB_STATUS,
  DEFAULT_CATEGORY_STYLE,
} from "@/lib/tokens";
import type { TicketSeverity, AgentAction, TicketStatus } from "@/lib/types";
import * as I from "./icons";

export function CategoryBadge({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const c = CATEGORIES[name] || DEFAULT_CATEGORY_STYLE;
  const cls =
    size === "sm"
      ? "text-[10px] px-1.5 py-[1px]"
      : "text-[10.5px] px-2 py-[2px]";
  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide rounded-md border ${cls}`}
      style={{ color: c.fg, background: c.bg, borderColor: c.border }}
    >
      {name}
    </span>
  );
}

export function SeverityPill({
  level,
  withLabel = true,
}: {
  level: TicketSeverity;
  withLabel?: boolean;
}) {
  const s = SEVERITY[level] || SEVERITY.low;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2">
      <span
        className="w-[7px] h-[7px] rounded-full"
        style={{ background: s.color }}
      />
      {withLabel && s.label}
    </span>
  );
}

export function StatusPill({ status }: { status: TicketStatus }) {
  const s = STATUSES[status] || STATUSES.Dismissed;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[2px] rounded-md border"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {status}
    </span>
  );
}

export function KBStatusBadge({ status }: { status: string }) {
  const s = KB_STATUS[status] || KB_STATUS.Outdated;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px]">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      <span style={{ color: s.fg }}>{status}</span>
    </span>
  );
}

export function DecisionBadge({ kind }: { kind: AgentAction }) {
  const d = DECISION[kind];
  if (!d) return null;
  return (
    <span
      className="inline-flex items-center font-mono text-[10.5px] font-semibold tracking-wide rounded-md border px-2 py-[2px]"
      style={{ color: d.fg, background: d.bg, borderColor: d.border }}
    >
      {d.label}
    </span>
  );
}

export function BetaBadge() {
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-medium px-1.5 py-[1px] rounded-md text-info"
      style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
    >
      Beta
    </span>
  );
}

export function ScoreBar({
  value,
  color = "#EA5F3E",
  height = 4,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="w-full rounded-full bar-fill overflow-hidden"
      style={{ height, background: "#F1F1EF" }}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  );
}

export function Card({
  className = "",
  children,
  padded = true,
  hoverable = false,
  ...rest
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
  hoverable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card border border-line rounded-lg shadow-card ${hoverable ? "transition-colors hover:border-line2" : ""} ${padded ? "p-5" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type BtnVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "quiet"
  | "outline"
  | "danger";

export function Btn({
  variant = "ghost",
  size = "md",
  icon,
  children,
  className = "",
  ...rest
}: {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "h-7 px-2.5 text-[12px] gap-1.5",
    md: "h-8 px-3 text-[12.5px] gap-2",
    lg: "h-10 px-4 text-[13.5px] gap-2",
  };
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-accent text-white hover:bg-accent2 font-medium border border-accent2",
    secondary: "bg-ink text-white hover:bg-ink2 font-medium",
    ghost:
      "bg-card text-ink2 hover:text-ink hover:bg-sunken border border-line",
    quiet: "bg-transparent text-muted hover:text-ink",
    outline:
      "bg-card text-accent hover:bg-accent-bg border border-accent-line font-medium",
    danger: "bg-card text-crit hover:bg-red-50 border border-red-200",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md transition-colors ring-focus ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function CopyButton({
  text,
  label = "Copy to Clipboard",
  size = "sm",
  variant = "ghost",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  variant?: BtnVariant;
}) {
  const [done, setDone] = useState(false);
  const onClick = () => {
    try {
      navigator.clipboard.writeText(text || "");
    } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  };
  return (
    <span className="inline-flex">
      <Btn
        size={size}
        variant={variant}
        onClick={onClick}
        className="min-w-[140px]"
        icon={
          done ? (
            <I.Check className="w-3.5 h-3.5 text-low" />
          ) : (
            <I.Copy className="w-3.5 h-3.5" />
          )
        }
      >
        {done ? "Copied" : label}
      </Btn>
    </span>
  );
}

export function KBD({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono text-muted bg-sunken border border-line rounded">
      {children}
    </span>
  );
}

export function ToolPill({
  children,
  kind = "default",
}: {
  children: ReactNode;
  kind?: "default" | "success" | "warn" | "danger" | "accent";
}) {
  const styles: Record<string, { fg: string; bg: string; border: string }> = {
    default: { fg: "#1C1917", bg: "#F5F5F4", border: "#E7E5E4" },
    success: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
    warn: { fg: "#A16207", bg: "#FEFCE8", border: "#FDE68A" },
    danger: { fg: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
    accent: { fg: "#9A3412", bg: "#FFF7ED", border: "#FED7AA" },
  };
  const s = styles[kind];
  return (
    <span
      className="inline-flex items-center font-mono text-[10.5px] font-medium tracking-tight rounded border px-1.5 py-[1px]"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
    >
      {children}
    </span>
  );
}

export function ConfidencePill({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <div className="flex items-center gap-2 min-w-22">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-muted3" /> No match
        </span>
      </div>
    );
  }
  const pct = Math.round(value * 100);
  const color =
    value >= 0.85
      ? "#16A34A"
      : value >= 0.7
        ? "#CA8A04"
        : value >= 0.55
          ? "#A16207"
          : "#A8A29E";
  return (
    <div className="flex items-center gap-2 min-w-22">
      <span
        className="font-mono text-[12px] tabular-nums text-right"
        style={{ color }}
      >
        {pct}%
      </span>
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: "#F1F1EF" }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function FilterChip({
  icon,
  label,
  value,
  onRemove,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-line bg-card text-[12px] text-ink2 shadow-card">
      {icon && <span className="text-muted2">{icon}</span>}
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-muted2 hover:text-ink ml-0.5"
        >
          <I.X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

export function TabBar({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (id: string) => void;
  tabs: { id: string; label: string; count?: number }[];
}) {
  return (
    <div className="flex items-center gap-5 -mb-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative pb-1.5 text-[13px] transition-colors ${
            value === t.id
              ? "text-ink font-medium"
              : "text-muted hover:text-ink"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            {t.label}
            {t.count != null && (
              <span
                className={`text-[11px] font-mono px-1.5 rounded ${value === t.id ? "bg-accent-bg text-accent" : "bg-sunken text-muted"}`}
              >
                {t.count}
              </span>
            )}
          </span>
          {value === t.id && (
            <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] tracking-wide font-medium text-muted2 uppercase mb-1.5">
        {label}
      </div>
      <div className="text-[13.5px] text-ink2 leading-relaxed">{children}</div>
    </div>
  );
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span>{children}</span>
    </div>
  );
}
