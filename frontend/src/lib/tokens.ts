import type {
  TicketSeverity,
  AgentAction,
  TicketStatus,
  TicketCategory,
} from "./types";

export const SEVERITY: Record<
  TicketSeverity,
  { color: string; label: string }
> = {
  critical: { color: "#DC2626", label: "Critical" },
  high: { color: "#EA580C", label: "High" },
  medium: { color: "#CA8A04", label: "Medium" },
  low: { color: "#16A34A", label: "Low" },
};

export const DECISION: Record<
  AgentAction,
  { label: string; text: string; fg: string; bg: string; border: string }
> = {
  RESPOND_FROM_KB: {
    label: "RESPOND_FROM_KB",
    text: "Respond from KB",
    fg: "#15803D",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  SUGGEST_KB_MATCH: {
    label: "SUGGEST_KB_MATCH",
    text: "Suggest KB match",
    fg: "#A16207",
    bg: "#FEFCE8",
    border: "#FDE68A",
  },
  GENERATE_BUG_REPORT: {
    label: "GENERATE_BUG_REPORT",
    text: "Generate bug report",
    fg: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  NEW_ISSUE_TRACK: {
    label: "NEW_ISSUE_TRACK",
    text: "New issue track",
    fg: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
};

export const STATUSES: Record<
  TicketStatus,
  { fg: string; bg: string; border: string; dot: string }
> = {
  "Pending Review": {
    fg: "#A16207",
    bg: "#FEFCE8",
    border: "#FDE68A",
    dot: "#CA8A04",
  },
  Sent: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", dot: "#16A34A" },
  Resolved: { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", dot: "#2563EB" },
  Dismissed: {
    fg: "#57534E",
    bg: "#F5F5F4",
    border: "#E7E5E4",
    dot: "#A8A29E",
  },
  "No match": {
    fg: "#9F1239",
    bg: "#FFF1F2",
    border: "#FECDD3",
    dot: "#E11D48",
  },
};

export const CATEGORIES: Record<
  string,
  { fg: string; bg: string; border: string }
> = {
  Integration: { fg: "#9A3412", bg: "#FFF7ED", border: "#FED7AA" },
  Metrics: { fg: "#5B21B6", bg: "#F5F3FF", border: "#DDD6FE" },
  Auth: { fg: "#9D174D", bg: "#FDF2F8", border: "#FBCFE8" },
  "AI Attribution": { fg: "#9A3412", bg: "#FFF7ED", border: "#FED7AA" },
  Sync: { fg: "#166534", bg: "#F0FDF4", border: "#BBF7D0" },
  Account: { fg: "#854D0E", bg: "#FEFCE8", border: "#FEF08A" },
  Performance: { fg: "#9F1239", bg: "#FFF1F2", border: "#FECDD3" },
  Billing: { fg: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  "Feature Request": { fg: "#5B21B6", bg: "#F5F3FF", border: "#DDD6FE" },
  Other: { fg: "#57534E", bg: "#F5F5F4", border: "#E7E5E4" },
};

export const KB_STATUS: Record<string, { fg: string; dot: string }> = {
  Active: { fg: "#15803D", dot: "#16A34A" },
  "Resolved in product": { fg: "#1D4ED8", dot: "#2563EB" },
  Outdated: { fg: "#78716C", dot: "#A8A29E" },
};

export const DEFAULT_CATEGORY_STYLE = {
  fg: "#57534E",
  bg: "#F5F5F4",
  border: "#E7E5E4",
};
