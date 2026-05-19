"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shell } from "./shell";
import {
  Card,
  Btn,
  TabBar,
  ToolPill,
  ConfidencePill,
  StatusPill,
  CategoryBadge,
} from "./primitives";
import * as I from "./icons";
import { getLogs } from "@/lib/api";
import type { SupportLogEntry } from "@/lib/types";
import { SEVERITY } from "@/lib/tokens";

const DATE_OPTIONS = ["all time", "last 24h", "last 7d", "last 30d"] as const;
type DateRange = (typeof DATE_OPTIONS)[number];

const SOURCE_OPTIONS = ["all", "Slack", "Web"] as const;
type SourceFilter = (typeof SOURCE_OPTIONS)[number];

function SlackLogo({ size = 14 }: { size?: number }) {
  return (
    <Image src="/logos/slack.svg" alt="Slack" width={size} height={size} />
  );
}

function getDateCutoff(range: DateRange): number {
  if (range === "all time") return 0;
  const ms = {
    "last 24h": 86400000,
    "last 7d": 604800000,
    "last 30d": 2592000000,
  };
  return Date.now() - ms[range];
}

function FilterDropdown<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-line bg-card text-[12px] text-ink2 shadow-card hover:border-line2 transition-colors"
      >
        <span className="text-muted2">{icon}</span>
        <span className="text-muted">{label}</span>
        <span className="text-ink">{value}</span>
        <I.ChevronDown className="w-3 h-3 text-muted2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-card border border-line rounded-md shadow-lg z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                value === opt
                  ? "bg-sunken text-ink font-medium"
                  : "text-ink2 hover:bg-surface hover:text-ink"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolPath({ tools }: { tools: string[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tools.map((t, i) => (
        <span key={t + i} className="inline-flex items-center gap-1">
          <ToolPill kind={i === tools.length - 1 ? "success" : "default"}>
            {t}
          </ToolPill>
          {i < tools.length - 1 && (
            <span className="text-muted3 text-[10px]">&rarr;</span>
          )}
        </span>
      ))}
    </div>
  );
}

function FeedRow({
  t,
  onClick,
}: {
  t: SupportLogEntry;
  onClick: () => void;
}) {
  const sev = SEVERITY[t.severity] || SEVERITY.low;
  const when = t.timestamp ? formatRelativeTime(t.timestamp) : "";
  const rowCls = `cursor-pointer transition-colors hover:bg-surface`;

  return (
    <tr onClick={onClick} className={rowCls}>
      <td className="sticky left-0 z-10 px-5 py-3.5 align-top border-b border-line whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: sev.color }}
            />
            <span className="font-mono">{t.id.slice(0, 8)}...</span>
          </div>
          <div className="text-[11px] text-muted2">{when}</div>
        </div>
      </td>

      <td className="px-4 py-3.5 align-top border-b border-line min-w-65">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-ink whitespace-nowrap">
            {t.customerName || "Unknown"}
          </span>
          <span className="text-[12px] text-muted2 whitespace-nowrap">
            · {t.customerOrg || "Unknown"}
          </span>
          <CategoryBadge name={t.category || "Other"} size="sm" />
        </div>
        <div className="text-[12.5px] text-muted leading-snug line-clamp-2 max-w-105">
          {t.customerMessage}
        </div>
      </td>

      <td className="px-4 py-3.5 align-top border-b border-line w-60">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted whitespace-nowrap">
            {t.source === "Slack" ? (
              <SlackLogo />
            ) : (
              <I.Inbox className="w-3.5 h-3.5 text-muted2" />
            )}
            <span className="text-ink2">{t.source}</span>
            {t.slackChannel && (
              <span className="text-muted2 font-mono text-[11px]">
                {t.slackChannel}
              </span>
            )}
          </div>
          <ToolPath tools={t.toolsUsed || []} />
        </div>
      </td>

      <td className="px-4 py-3.5 align-top border-b border-line whitespace-nowrap">
        <ConfidencePill value={t.confidence} />
      </td>

      <td className="px-4 py-3.5 align-top border-b border-line whitespace-nowrap text-right">
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill status={t.status} />
          {t.githubIssueNumber && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-muted">
              <I.Github className="w-3 h-3" /> #{t.githubIssueNumber}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

export function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState("feed");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState<DateRange>("all time");
  const [filterSource, setFilterSource] = useState<SourceFilter>("all");
  const [logs, setLogs] = useState<SupportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const cutoff = getDateCutoff(filterDate);
  const items = logs.filter((f) => {
    if (filterStatus !== "all" && f.status.toLowerCase() !== filterStatus)
      return false;
    if (filterSource !== "all" && f.source !== filterSource) return false;
    if (cutoff && f.timestamp && new Date(f.timestamp).getTime() < cutoff)
      return false;
    return true;
  });

  function handleNav(id: string) {
    if (id === "intake") router.push("/intake");
    else if (id === "notion") window.open("https://www.notion.so/364292ef3e5780afa34adecef9afb1f3?v=364292ef3e5780fc9038000ced7c022f", "_blank");
    else if (id === "github") window.open("https://github.com/anujgawde/loopback-support-agent/issues", "_blank");
  }

  return (
    <Shell
      active="feed"
      onNav={handleNav}
      eyebrow="Support"
      title="Ticket feed"
      tabs={
        <TabBar
          value={tab}
          onChange={(v) =>
            v === "intake" ? router.push("/intake") : setTab(v)
          }
          tabs={[
            { id: "feed", label: "Ticket Feed", count: logs.length },
            { id: "intake", label: "Manual Intake" },
          ]}
        />
      }
      filters={
        <>
          <FilterDropdown
            icon={<I.Calendar className="w-3.5 h-3.5" />}
            label="Date"
            value={filterDate}
            options={DATE_OPTIONS}
            onChange={setFilterDate}
          />
          <FilterDropdown
            icon={
              filterSource === "Slack" ? (
                <SlackLogo />
              ) : (
                <I.Inbox className="w-3.5 h-3.5" />
              )
            }
            label="Source"
            value={filterSource}
            options={SOURCE_OPTIONS}
            onChange={setFilterSource}
          />
          <div className="ml-auto" />
          <div className="flex items-center bg-card border border-line rounded-md p-0.5">
            {["all", "pending review", "sent", "resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`h-6 px-2 text-[11.5px] rounded capitalize transition-colors ${
                  filterStatus === s
                    ? "bg-sunken text-ink font-medium"
                    : "text-muted hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      }
      headerRight={
        <Btn
          size="md"
          variant="primary"
          icon={<I.Bolt className="w-3.5 h-3.5" />}
          onClick={() => router.push("/intake")}
        >
          New ticket
        </Btn>
      }
    >
      <div className="px-8 py-6">
        <Card padded={false} className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10.5px] tracking-wide font-medium text-muted2 uppercase border-b border-line">
                <th className="sticky left-0 z-10 bg-card text-left px-5 py-2 whitespace-nowrap font-medium">
                  Ticket
                </th>
                <th className="text-left px-4 py-2 whitespace-nowrap font-medium">
                  Customer & message
                </th>
                <th className="text-left px-4 py-2 whitespace-nowrap font-medium w-60">
                  Source · Tools used
                </th>
                <th className="text-left px-4 py-2 whitespace-nowrap font-medium">
                  Confidence
                </th>
                <th className="text-right px-4 py-2 whitespace-nowrap font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted">
                    <div className="flex items-center justify-center">
                      <I.Spinner className="w-5 h-5 text-accent" />
                      <span className="ml-3 text-[13px]">
                        Loading tickets...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <I.Inbox className="w-8 h-8 text-muted3 mb-3" />
                      <span className="text-[13px]">No tickets found</span>
                      <span className="text-[12px] text-muted2 mt-1">
                        Process a message from Manual Intake to create your
                        first ticket.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <FeedRow
                    key={t.id}
                    t={t}
                    onClick={() => router.push(`/tickets/${t.id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </Card>

        {items.length > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-muted">
            <span className="h-px w-12 bg-line" />
            Showing {items.length} of {logs.length} tickets
            {filterDate !== "all time" ? ` · ${filterDate}` : ""}
            {filterSource !== "all" ? ` · ${filterSource}` : ""}
            <span className="h-px w-12 bg-line" />
          </div>
        )}
      </div>
    </Shell>
  );
}
