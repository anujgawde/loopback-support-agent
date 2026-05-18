export type TicketCategory =
  | 'Integration'
  | 'Metrics'
  | 'Auth'
  | 'AI Attribution'
  | 'Sync'
  | 'Account'
  | 'Performance'
  | 'Billing'
  | 'Feature Request'
  | 'Other';

export type TicketSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AgentAction =
  | 'RESPOND_FROM_KB'
  | 'SUGGEST_KB_MATCH'
  | 'NEW_ISSUE_TRACK'
  | 'GENERATE_BUG_REPORT';

export type TicketStatus =
  | 'Pending Review'
  | 'Sent'
  | 'Resolved'
  | 'Dismissed'
  | 'No match';

export interface ToolCallLog {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: string;
}

export interface KBMatch {
  id: string;
  title: string;
  score: number;
  frequency: number;
}

export interface BugReport {
  title: string;
  severity: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
  customerImpact: string;
  suggestedLabels: string[];
  issueNumber?: number;
  githubUrl?: string;
}

export interface SupportLogEntry {
  id: string;
  title: string;
  timestamp: string;
  customerMessage: string;
  customerName: string;
  customerOrg: string;
  source: 'Slack' | 'Web';
  slackChannel: string;
  category: TicketCategory;
  severity: TicketSeverity;
  decision: AgentAction;
  confidence: number | null;
  toolsUsed: string[];
  agentResponse: string | null;
  kbArticleMatched: string;
  kbMatch: KBMatch | null;
  bugReport: BugReport | null;
  bugReportFiled: boolean;
  githubIssueUrl: string;
  githubIssueNumber: number | null;
  status: TicketStatus;
}

export interface KBArticle {
  id: string;
  title: string;
  category: TicketCategory;
  status: 'Active' | 'Resolved in product' | 'Outdated';
  frequency: number;
  lastSeen: string;
  score: number;
  snippet: string;
  symptoms?: string[];
  rootCause?: string;
  resolution?: string[];
  triggerPhrases?: string[];
  relatedGithubIssues?: string[];
}

export interface AgentResult {
  response: string | null;
  toolCalls: ToolCallLog[];
  logId: string;
  classification?: {
    category: TicketCategory;
    severity: TicketSeverity;
    symptomSummary: string;
  };
  decision?: {
    action: AgentAction;
    confidence: number;
    reasoning: string;
  };
  kbMatches?: KBMatch[];
  bugReport?: BugReport;
}
