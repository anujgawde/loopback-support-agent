'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from './shell';
import { Card, Btn, TabBar, FilterChip, ToolPill, ConfidencePill, StatusPill, SeverityPill, CategoryBadge } from './primitives';
import * as I from './icons';
import { getLogs } from '@/lib/api';
import type { SupportLogEntry, TicketStatus } from '@/lib/types';
import { SEVERITY } from '@/lib/tokens';

function ToolPath({ tools }: { tools: string[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tools.map((t, i) => (
        <span key={t + i} className="inline-flex items-center gap-1">
          <ToolPill kind={i === tools.length - 1 ? 'success' : 'default'}>{t}</ToolPill>
          {i < tools.length - 1 && <span className="text-muted3 text-[10px]">&rarr;</span>}
        </span>
      ))}
    </div>
  );
}

function FeedRow({ t, active, onClick }: { t: SupportLogEntry; active: boolean; onClick: () => void }) {
  const sev = SEVERITY[t.severity] || SEVERITY.low;
  const when = t.timestamp ? formatRelativeTime(t.timestamp) : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left grid grid-cols-[110px_minmax(0,1fr)_240px_120px_110px] items-start gap-4 px-5 py-3.5 border-b border-line transition-colors ${
        active ? 'bg-accent-bg/40' : 'hover:bg-surface'
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.color }} />
          <span className="font-mono">{t.id}</span>
        </div>
        <div className="text-[11px] text-muted2">{when}</div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-ink truncate">{t.customerName || 'Unknown'}</span>
          <span className="text-[12px] text-muted2 truncate">· {t.customerOrg || 'Unknown'}</span>
          <CategoryBadge name={t.category || 'Other'} size="sm" />
        </div>
        <div className="text-[12.5px] text-muted leading-snug line-clamp-2">{t.customerMessage}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
          {t.source === 'Slack' ? <I.Slack className="w-3.5 h-3.5" /> : <I.Inbox className="w-3.5 h-3.5 text-muted2" />}
          <span className="text-ink2">{t.source}</span>
          {t.slackChannel && <span className="text-muted2 font-mono text-[11px] truncate">{t.slackChannel}</span>}
        </div>
        <ToolPath tools={t.toolsUsed || []} />
      </div>

      <div className="pt-0.5">
        <ConfidencePill value={t.confidence} />
      </div>

      <div className="flex flex-col items-end gap-1.5 pt-0.5">
        <StatusPill status={t.status} />
        {t.githubIssueNumber && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-muted">
            <I.Github className="w-3 h-3" /> #{t.githubIssueNumber}
          </span>
        )}
      </div>
    </button>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState('feed');
  const [filterStatus, setFilterStatus] = useState('all');
  const [logs, setLogs] = useState<SupportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const items = filterStatus === 'all'
    ? logs
    : logs.filter(f => f.status.toLowerCase() === filterStatus);

  function handleNav(id: string) {
    if (id === 'intake') router.push('/intake');
    else if (id === 'notion') window.open('https://www.notion.so', '_blank');
    else if (id === 'github') window.open('https://github.com', '_blank');
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
          onChange={(v) => v === 'intake' ? router.push('/intake') : setTab(v)}
          tabs={[
            { id: 'feed', label: 'Ticket Feed', count: logs.length },
            { id: 'intake', label: 'Manual Intake' },
          ]}
        />
      }
      filters={
        <>
          <FilterChip icon={<I.Calendar className="w-3.5 h-3.5" />} label="Date" value="last 24h" onRemove={() => {}} />
          <FilterChip icon={<I.Slack className="w-3.5 h-3.5" />} label="Source" value="all" onRemove={() => {}} />
          <button className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-dashed border-line text-[12px] text-muted hover:text-ink hover:border-line2">
            <I.Plus className="w-3 h-3" /> Add filter
          </button>
          <div className="ml-auto" />
          <div className="flex items-center bg-card border border-line rounded-md p-0.5">
            {['all', 'pending review', 'sent', 'resolved'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`h-6 px-2 text-[11.5px] rounded capitalize transition-colors ${
                  filterStatus === s ? 'bg-sunken text-ink font-medium' : 'text-muted hover:text-ink'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </>
      }
      headerRight={
        <Btn size="md" variant="primary" icon={<I.Bolt className="w-3.5 h-3.5" />}
             onClick={() => router.push('/intake')}>
          New ticket
        </Btn>
      }
    >
      <div className="px-8 py-6">
        <Card padded={false} className="overflow-hidden">
          <div className="grid grid-cols-[110px_minmax(0,1fr)_240px_120px_110px] items-center gap-4 px-5 h-9 border-b border-line text-[10.5px] tracking-wide font-medium text-muted2 uppercase">
            <span>Ticket</span>
            <span>Customer & message</span>
            <span>Source · Tools used</span>
            <span>Confidence</span>
            <span className="text-right">Status</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted">
              <I.Spinner className="w-5 h-5 text-accent" />
              <span className="ml-3 text-[13px]">Loading tickets...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted">
              <I.Inbox className="w-8 h-8 text-muted3 mb-3" />
              <span className="text-[13px]">No tickets found</span>
              <span className="text-[12px] text-muted2 mt-1">Process a message from Manual Intake to create your first ticket.</span>
            </div>
          ) : (
            items.map((t, i) => (
              <FeedRow
                key={t.id}
                t={t}
                active={i === 0}
                onClick={() => router.push(`/tickets/${t.id}`)}
              />
            ))
          )}
        </Card>

        {items.length > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-muted">
            <span className="h-px w-12 bg-line" />
            Showing {items.length} of {logs.length} tickets · processed in the last 24 hours
            <span className="h-px w-12 bg-line" />
          </div>
        )}
      </div>
    </Shell>
  );
}
