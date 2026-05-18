'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from './shell';
import {
  Card, Btn, CopyButton, CategoryBadge, SeverityPill, StatusPill,
  DecisionBadge, ConfidencePill, ScoreBar, ToolPill, Field, Row,
} from './primitives';
import * as I from './icons';
import { getLog } from '@/lib/api';
import type { SupportLogEntry, BugReport } from '@/lib/types';

interface ToolTimelineStepData {
  tool: string;
  arg?: string;
  summary: string;
  status: 'done' | 'running' | 'pending';
  link?: string;
}

function ToolTimelineStep({ step, last }: { step: ToolTimelineStepData; last: boolean }) {
  const isDone = step.status === 'done';
  const isRunning = step.status === 'running';
  return (
    <div className="relative pl-9 pb-5 last:pb-0">
      {!last && <span className="absolute left-[14px] top-7 bottom-0 w-px bg-line" />}
      <div
        className="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: isDone ? '#F0FDF4' : isRunning ? '#FEF1ED' : '#F5F5F4',
          border: `1px solid ${isDone ? '#BBF7D0' : isRunning ? '#FBD3C7' : '#E7E5E4'}`,
        }}
      >
        {isDone && <I.Check className="w-3.5 h-3.5 text-low" />}
        {isRunning && <I.Spinner className="w-3.5 h-3.5 text-accent" />}
        {!isDone && !isRunning && <span className="w-1.5 h-1.5 rounded-full bg-muted3" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <code className="text-[12.5px] font-mono text-ink font-medium">{step.tool}</code>
          {step.arg && <code className="text-[11.5px] font-mono text-muted truncate">({step.arg})</code>}
        </div>
        <div className="text-[12.5px] text-ink2">
          {step.summary}
          {step.link && (
            <a className="ml-1.5 inline-flex items-center gap-1 text-accent hover:underline">
              <I.External className="w-3 h-3" /> {step.link}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolTimeline({ steps }: { steps: ToolTimelineStepData[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase">Agent reasoning</h3>
        <span className="text-[10.5px] font-mono text-muted">gemini-2.5-flash · 1.84s</span>
      </div>
      <div>
        {steps.map((s, i) => <ToolTimelineStep key={i} step={s} last={i === steps.length - 1} />)}
      </div>
    </Card>
  );
}

function TicketHeader({ t, onBack }: { t: SupportLogEntry; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] text-muted hover:text-ink transition-colors">
          <I.ChevronLeft className="w-3.5 h-3.5" /> Ticket feed
        </button>
        <span className="text-muted3">/</span>
        <span className="font-mono text-[12.5px] text-ink2">{t.id}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge name={t.category || 'Other'} />
            <SeverityPill level={t.severity || 'medium'} />
            <span className="text-muted3 text-[12px]">&middot;</span>
            <span className="text-[12.5px] text-muted">
              {t.source === 'Slack' ? (
                <span className="inline-flex items-center gap-1.5">
                  <I.Slack className="w-3.5 h-3.5" /> Slack
                  {t.slackChannel && <span className="font-mono text-muted2">{t.slackChannel}</span>}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><I.Inbox className="w-3.5 h-3.5" /> Web</span>
              )}
              <span className="text-muted3 mx-1.5">&middot;</span>
              {t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}
            </span>
          </div>
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            {t.customerName || 'Unknown'} <span className="text-muted">&middot;</span> <span className="text-muted">{t.customerOrg || 'Unknown'}</span>
          </h2>
        </div>
        <StatusPill status={t.status} />
      </div>

      <Card padded={false}>
        <div className="px-5 py-3 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2 text-[11px] tracking-wide font-medium text-muted2 uppercase">Customer message</div>
          <div className="text-[10.5px] font-mono text-muted">
            {t.customerMessage.length} chars · {t.customerMessage.split(/\s+/).length} words
          </div>
        </div>
        <p className="px-5 py-4 text-[14px] text-ink2 leading-relaxed">{t.customerMessage}</p>
      </Card>
    </div>
  );
}

function KBMatchCard({ match }: { match: { id: string; title: string; score: number; frequency: number } }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase">Top KB match</h3>
        <a className="inline-flex items-center gap-1 text-[11.5px] text-accent hover:underline cursor-pointer"
           href="https://www.notion.so" target="_blank" rel="noreferrer">
          Open in Notion <I.External className="w-3 h-3" />
        </a>
      </div>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-[15px] font-medium text-ink leading-snug">{match.title}</div>
          <div className="flex items-center gap-2 mt-1.5 text-[11.5px] text-muted">
            <CategoryBadge name="Integration" size="sm" />
            <span>&middot; {match.frequency} occurrences</span>
            <span>&middot; last seen 12m ago</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[24px] tabular-nums text-accent leading-none">{Math.round(match.score * 100)}%</div>
          <div className="text-[10.5px] tracking-wide font-medium text-muted2 mt-1">SIMILARITY</div>
        </div>
      </div>
      <ScoreBar value={match.score} color="#EE5734" height={6} />
      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-[11.5px] text-muted">
        <a className="inline-flex items-center gap-1.5 hover:text-ink cursor-pointer">
          <I.Notion className="w-3.5 h-3.5" /> View in Notion
        </a>
        <a className="inline-flex items-center gap-1.5 hover:text-ink cursor-pointer">
          <I.Github className="w-3.5 h-3.5" /> Related issues
        </a>
      </div>
    </Card>
  );
}

function DraftResponseBlock({ draft, onChange }: { draft: string; onChange: (v: string) => void }) {
  return (
    <Card padded={false}>
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-line">
        <div>
          <div className="text-[11px] tracking-wide font-medium text-muted2 uppercase">Draft response</div>
          <div className="text-[11.5px] text-muted mt-0.5">Generated from KB · ready to send</div>
        </div>
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="ghost" icon={<I.Refresh className="w-3.5 h-3.5" />}>Regenerate</Btn>
          <Btn size="sm" variant="ghost" icon={<I.Edit className="w-3.5 h-3.5" />}>Adjust tone</Btn>
        </div>
      </div>
      <div className="p-5">
        <textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          rows={11}
          className="w-full bg-surface border border-line rounded-md p-4 text-[14px] leading-[1.65] text-ink2 resize-none ring-focus"
        />
      </div>
      <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface/60">
        <div className="text-[11.5px] text-muted">
          Ready to copy and send
        </div>
        <div className="flex items-center gap-2">
          <Btn size="md" variant="ghost">Mark Resolved</Btn>
          <CopyButton text={draft} label="Copy to Clipboard" size="md" variant="primary" />
        </div>
      </div>
    </Card>
  );
}

function BugReportBlock({ bug }: { bug: BugReport }) {
  const md = `# ${bug.title}\n\n**Severity:** ${bug.severity}\n\n## Description\n${bug.description}\n\n## Steps to Reproduce\n${bug.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n## Expected\n${bug.expectedBehavior}\n\n## Actual\n${bug.actualBehavior}\n\n## Environment\n${bug.environment}\n\n## Customer Impact\n${bug.customerImpact}\n\n**Labels:** ${bug.suggestedLabels.map(l => '`' + l + '`').join(' ')}`;

  return (
    <Card padded={false}>
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-line">
        <div>
          <div className="text-[11px] tracking-wide font-medium text-muted2 uppercase">Bug report</div>
          <div className="text-[11.5px] text-muted mt-0.5">
            Auto-generated{bug.issueNumber ? ` · synced to GitHub issue #${bug.issueNumber}` : ''}
          </div>
        </div>
        <Btn size="sm" variant="ghost" icon={<I.Edit className="w-3.5 h-3.5" />}>Edit</Btn>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[18px] font-semibold tracking-tight text-ink">{bug.title}</h3>
            <SeverityPill level="critical" />
          </div>
          <Field label="Description">{bug.description}</Field>
          <Field label="Steps to reproduce">
            <ol className="text-[13.5px] text-ink2 space-y-1.5 leading-relaxed">
              {bug.stepsToReproduce.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="font-mono text-muted2 tabular-nums w-4">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expected">{bug.expectedBehavior}</Field>
            <Field label="Actual">{bug.actualBehavior}</Field>
          </div>
          <Field label="Environment">
            <span className="font-mono text-[12.5px] text-ink2">{bug.environment}</span>
          </Field>
          <Field label="Customer impact">{bug.customerImpact}</Field>
          <Field label="Labels">
            <div className="flex flex-wrap gap-1.5">
              {bug.suggestedLabels.map(l => (
                <span key={l} className="font-mono text-[11px] px-1.5 py-[2px] rounded border border-line bg-surface text-ink2">{l}</span>
              ))}
            </div>
          </Field>
          {bug.githubUrl && (
            <Field label="GitHub issue">
              <a className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline" href={bug.githubUrl} target="_blank" rel="noreferrer">
                <I.Github className="w-3.5 h-3.5" />
                Issue #{bug.issueNumber} — {bug.title}
                <I.External className="w-3 h-3" />
              </a>
            </Field>
          )}
        </div>
      </div>
      <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface/60">
        <div className="text-[11.5px] text-muted">
          Source: <span className="font-mono text-ink2">{bug.issueNumber ? `#${bug.issueNumber}` : 'pending'}</span>
        </div>
        <div className="flex items-center gap-2">
          {bug.githubUrl && (
            <Btn size="md" variant="ghost" icon={<I.External className="w-3.5 h-3.5" />}>View GitHub Issue</Btn>
          )}
          <CopyButton text={md} label="Copy as Markdown" size="md" variant="primary" />
        </div>
      </div>
    </Card>
  );
}

function TicketSidebar({ t }: { t: SupportLogEntry }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase mb-3">Classification</h3>
        <div className="space-y-2.5 text-[12.5px]">
          <Row label="Category"><CategoryBadge name={t.category || 'Other'} size="sm" /></Row>
          <Row label="Severity"><SeverityPill level={t.severity || 'medium'} /></Row>
          <Row label="Decision"><DecisionBadge kind={t.decision} /></Row>
          <Row label="Confidence">
            {t.confidence != null
              ? <span className="font-mono tabular-nums text-ink">{Math.round(t.confidence * 100)}%</span>
              : <span className="text-muted">&mdash;</span>}
          </Row>
        </div>
      </Card>

      <Card>
        <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase mb-3">Customer</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-rose-400 flex items-center justify-center text-white text-[12px] font-semibold">
            {(t.customerName || 'U').split(' ').map(p => p[0]).join('').slice(0, 2)}
          </div>
          <div className="leading-tight">
            <div className="text-[13.5px] font-medium text-ink">{t.customerName || 'Unknown'}</div>
            <div className="text-[11.5px] text-muted">{t.customerOrg || 'Unknown'}</div>
          </div>
        </div>
        <div className="space-y-2 text-[12px] pt-3 border-t border-line">
          <Row label="Source"><span className="text-ink2">{t.source}</span></Row>
          {t.slackChannel && <Row label="Channel"><span className="font-mono text-ink2">{t.slackChannel}</span></Row>}
        </div>
      </Card>

      <Card>
        <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase mb-3">Activity</h3>
        <div className="relative pl-4 flex flex-col gap-3">
          <span className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />
          {(t.toolsUsed || []).slice().reverse().map((tool, i) => (
            <div key={i} className="flex flex-col gap-0.5 text-[12px] relative">
              <span
                className="absolute -left-4 top-1 w-[11px] h-[11px] rounded-full border-2 border-page"
                style={{ background: '#EE5734' }}
              />
              <span className="text-ink2">Used tool: {tool}</span>
              <span className="font-mono text-[10.5px] text-muted2">Agent</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5 text-[12px] relative">
            <span
              className="absolute -left-4 top-1 w-[11px] h-[11px] rounded-full border-2 border-page"
              style={{ background: '#A8A29E' }}
            />
            <span className="text-ink2">Message received via {t.source}</span>
            <span className="font-mono text-[10.5px] text-muted2">{t.source} · {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function buildTimelineSteps(t: SupportLogEntry): ToolTimelineStepData[] {
  const isBug = t.decision === 'GENERATE_BUG_REPORT';
  const isNew = t.decision === 'NEW_ISSUE_TRACK';

  if (isBug) {
    return [
      { tool: 'search_kb', arg: `"${t.customerMessage.slice(0, 30)}..."`, summary: 'No match found above 0.55 threshold', status: 'done' },
      { tool: 'generate_bug_report', arg: `message, "${t.category}", "${t.severity}"`, summary: 'Structured report drafted', status: 'done' },
      ...(t.githubIssueNumber ? [{
        tool: 'create_github_issue', arg: `"${t.title || 'Bug Report'}", ...`, summary: `Issue created with labels`, status: 'done' as const, link: `#${t.githubIssueNumber}`,
      }] : []),
    ];
  }
  if (isNew) {
    return [
      { tool: 'search_kb', arg: `"${t.customerMessage.slice(0, 30)}..."`, summary: 'No match found · 0 candidates above floor', status: 'done' },
      { tool: 'classify_as_new_issue', arg: `category="${t.category}"`, summary: 'Tracked as new issue · suggested KB article queued', status: 'done' },
    ];
  }
  return [
    { tool: 'search_kb', arg: `"${t.customerMessage.slice(0, 30)}..."`, summary: t.kbMatch ? `Found: "${t.kbMatch.title}" at ${Math.round(t.kbMatch.score * 100)}%` : 'Searching knowledge base', status: 'done' },
    { tool: 'draft_response', arg: t.kbMatch ? `message, "${t.kbMatch.id}"` : 'message', summary: 'Draft generated', status: 'done' },
    ...(t.kbMatch ? [{ tool: 'update_kb', arg: `"${t.kbMatch.id}", frequencyBump: true`, summary: `Frequency updated`, status: 'done' as const }] : []),
  ];
}

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    getLog(ticketId)
      .then(t => {
        setTicket(t);
        setDraft(t.agentResponse || '');
      })
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  function handleNav(id: string) {
    if (id === 'feed') router.push('/');
    else if (id === 'intake') router.push('/intake');
    else if (id === 'notion') window.open('https://www.notion.so', '_blank');
    else if (id === 'github') window.open('https://github.com', '_blank');
  }

  if (loading) {
    return (
      <Shell active="feed" onNav={handleNav} eyebrow="Support" title="Loading...">
        <div className="flex items-center justify-center py-24">
          <I.Spinner className="w-6 h-6 text-accent" />
        </div>
      </Shell>
    );
  }

  if (!ticket) {
    return (
      <Shell active="feed" onNav={handleNav} eyebrow="Support" title="Ticket not found">
        <div className="flex flex-col items-center justify-center py-24 text-muted">
          <I.Inbox className="w-8 h-8 text-muted3 mb-3" />
          <span className="text-[13px]">Ticket {ticketId} not found</span>
          <Btn size="md" variant="ghost" className="mt-4" onClick={() => router.push('/')}>
            Back to feed
          </Btn>
        </div>
      </Shell>
    );
  }

  const t = ticket;
  const isBug = t.decision === 'GENERATE_BUG_REPORT';
  const isNew = t.decision === 'NEW_ISSUE_TRACK';
  const steps = buildTimelineSteps(t);

  return (
    <Shell
      active="feed"
      onNav={handleNav}
      eyebrow="Support"
      title={`Ticket ${t.id}`}
      breadcrumb={
        <span className="inline-flex items-center gap-2 text-[12.5px] text-muted">
          <span className="text-muted3">&middot;</span> {t.customerName} · {t.customerOrg}
        </span>
      }
      headerRight={
        <div className="flex items-center gap-2">
          <Btn size="md" variant="ghost" icon={<I.External className="w-3.5 h-3.5" />}>Open in Slack</Btn>
          <Btn size="md" variant="ghost">Dismiss</Btn>
        </div>
      }
    >
      <div className="px-8 py-6 grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="flex flex-col gap-5 min-w-0">
          <TicketHeader t={t} onBack={() => router.push('/')} />
          <ToolTimeline steps={steps} />

          {!isBug && !isNew && t.kbMatch && (
            <>
              <KBMatchCard match={t.kbMatch} />
              <DraftResponseBlock draft={draft} onChange={setDraft} />
            </>
          )}

          {!isBug && !isNew && !t.kbMatch && t.agentResponse && (
            <DraftResponseBlock draft={draft} onChange={setDraft} />
          )}

          {isBug && t.bugReport && <BugReportBlock bug={t.bugReport} />}

          {isNew && (
            <Card>
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-info-bg border border-blue-200 mb-3">
                  <I.Sparkle className="w-5 h-5 text-info" />
                </div>
                <h3 className="text-[15px] font-semibold text-ink mb-1">No KB match — flagged as new issue</h3>
                <p className="text-[13px] text-muted max-w-md mx-auto leading-relaxed">
                  This is the first time we&apos;ve seen this pattern. Loopback has tracked it as a candidate new article.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Btn size="md" variant="ghost">Dismiss as one-off</Btn>
                  <Btn size="md" variant="primary" icon={<I.Plus className="w-3.5 h-3.5" />}>Create KB Article</Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
        <TicketSidebar t={t} />
      </div>
    </Shell>
  );
}
