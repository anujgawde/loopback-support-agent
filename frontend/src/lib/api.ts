import type { SupportLogEntry, KBArticle, AgentResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getLogs(): Promise<SupportLogEntry[]> {
  return request<SupportLogEntry[]>('/logs');
}

export async function getLog(id: string): Promise<SupportLogEntry> {
  return request<SupportLogEntry>(`/logs/${id}`);
}

export async function updateLogStatus(
  id: string,
  status: 'Pending Review' | 'Sent' | 'Resolved' | 'Dismissed',
): Promise<SupportLogEntry> {
  return request<SupportLogEntry>(`/logs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function markKbArticleCreated(logId: string): Promise<SupportLogEntry> {
  return request<SupportLogEntry>(`/logs/${logId}/kb-created`, { method: 'PATCH' });
}

export async function createKBArticle(article: Record<string, unknown>): Promise<KBArticle> {
  return request<KBArticle>('/kb/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });
}

export async function getKBArticles(): Promise<KBArticle[]> {
  return request<KBArticle[]>('/kb/articles');
}

export async function getKBArticle(id: string): Promise<KBArticle> {
  return request<KBArticle>(`/kb/articles/${id}`);
}

export async function searchKB(query: string): Promise<KBArticle[]> {
  return request<KBArticle[]>('/kb/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export interface DashboardStats {
  articles: number;
  resolutions: number;
  hitRate: number;
  agentOnline: boolean;
  pendingTickets: number;
}

export interface AppConfig {
  operatorName: string;
  workspaceName: string;
  companyName: string;
}

export async function getStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/analytics/stats');
}

export async function getAppConfig(): Promise<AppConfig> {
  return request<AppConfig>('/analytics/config');
}

export async function updateKBArticle(
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await request<{ success: boolean }>(`/kb/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function regenerateDraft(body: {
  customerMessage: string;
  resolution: string;
  rootCause?: string;
  logId?: string;
}): Promise<{ draftResponse: string }> {
  return request<{ draftResponse: string }>('/agent/regenerate-draft', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fileGithubIssue(body: {
  title: string;
  body: string;
  labels?: string[];
}): Promise<{ url: string; number: number }> {
  return request<{ url: string; number: number }>('/github/issues', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function processMessage(message: string, ticketId?: string): Promise<AgentResult> {
  return request<AgentResult>('/agent/process', {
    method: 'POST',
    body: JSON.stringify({ message, ...(ticketId ? { ticketId } : {}) }),
  });
}
