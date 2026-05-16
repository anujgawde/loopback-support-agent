export type TicketCategory =
  | 'Integration'
  | 'Metrics'
  | 'Auth'
  | 'AI Attribution'
  | 'Sync'
  | 'Account'
  | 'Feature Request'
  | 'Other';

export type TicketSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface KBArticle {
  id: string;
  title: string;
  category: TicketCategory;
  symptoms: string;
  rootCause: string;
  resolution: string;
  triggerPhrases: string[];
  frequency: number;
  lastSeen: string;
  relatedGithubIssues: string;
  status: 'Active' | 'Resolved in Product' | 'Outdated';
  notionUrl: string;
}

export interface TicketClassification {
  category: TicketCategory;
  severity: TicketSeverity;
  symptomSummary: string;
  rootCauseHypothesis: string;
  suggestedTriggerPhrases: string[];
  isMultipleIssues: boolean;
  decomposedIssues?: string[];
}

export type AgentAction =
  | 'RESPOND_FROM_KB'
  | 'SUGGEST_KB_MATCH'
  | 'NEW_ISSUE_TRACK'
  | 'GENERATE_BUG_REPORT';

export interface AgentDecision {
  action: AgentAction;
  confidence: number;
  reasoning: string;
}

export interface KBMatch {
  article: KBArticle;
  similarityScore: number;
}

export interface IntakeResult {
  classification: TicketClassification;
  decision: AgentDecision;
  kbMatches: KBMatch[];
  draftResponse?: string;
  bugReport?: BugReport;
  newTriggerPhrases?: string[];
}

export interface BugReport {
  title: string;
  severity: TicketSeverity;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    plan: string;
    integrations: string[];
    teamSize: string;
    relevantConfig: string;
  };
  customerImpact: string;
  suggestedLabels: string[];
  markdownBody: string;
}

export interface KBAnalytics {
  totalArticles: number;
  totalResolutions: number;
  topIssues: { title: string; frequency: number; category: TicketCategory }[];
  categoryBreakdown: { category: TicketCategory; count: number }[];
  recentlyActive: { title: string; lastSeen: string }[];
}
