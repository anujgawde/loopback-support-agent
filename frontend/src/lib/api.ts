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

export async function processMessage(message: string): Promise<AgentResult> {
  return request<AgentResult>('/agent/process', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
