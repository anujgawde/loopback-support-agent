'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from './shell';
import { Card, Btn, TabBar, KBD, SeverityPill, CopyButton, Field } from './primitives';
import * as I from './icons';
import { processMessage } from '@/lib/api';
import type { AgentResult, BugReport } from '@/lib/types';

const SAMPLE_TICKET = `Hey, we connected our GitHub org to Weave on Monday but the dashboard is still completely empty. No scores, no data, nothing. Our CTO wants the first report by Friday.`;

const SAMPLE_BUG_MSG = `Our dashboard is showing an error 500 when we click on the AI Insights tab. It was working fine yesterday. We're on the Pro plan with about 15 engineers. This is blocking our weekly engineering review meeting tomorrow.`;

const SAMPLE_NEW_ISSUE = `Is there a way to exclude certain repos from the Weave Score calculation? We have a few archive repos that are skewing things.`;

interface ProcessingStepData {
  label: string;
  result?: string;
}

function ProcessingStep({ step, state }: { step: ProcessingStepData; state: 'done' | 'running' | 'pending' }) {
  const isDone = state === 'done';
  const isRunning = state === 'running';
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 mt-0.5 flex items-center justify-center shrink-0">
        {isDone && <I.Check className="w-4 h-4 text-low" />}
        {isRunning && <I.Spinner className="w-4 h-4 text-accent" />}
        {!isDone && !isRunning && <span className="w-1.5 h-1.5 rounded-full bg-muted3" />}
      </div>
      <div className="flex-1">
        <div className={`text-[13px] ${isDone || isRunning ? 'text-ink' : 'text-muted2'}`}>
          {step.label}
          {isRunning && <span className="blink ml-0.5">_</span>}
        </div>
        {step.result && isDone && (
          <div className="text-[12px] text-muted mt-0.5">{step.result}</div>
        )}
      </div>
    </div>
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
        </div>
      </div>
      <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface/60">
        <div className="text-[11.5px] text-muted">
          {bug.githubUrl ? (
            <>Source: <a href={bug.githubUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline font-mono">#{bug.issueNumber}</a></>
          ) : 'Created locally'}
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

export function IntakePage() {
  const router = useRouter();
  const [text, setText] = useState(SAMPLE_BUG_MSG);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [steps, setSteps] = useState<ProcessingStepData[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const run = useCallback(async () => {
    if (!text.trim()) return;
    setPhase('running');
    setResult(null);
    setElapsed(0);

    const processingSteps: ProcessingStepData[] = [
      { label: 'Classifying message' },
      { label: 'Searching knowledge base' },
      { label: 'Deciding action' },
      { label: 'Generating output' },
    ];
    setSteps(processingSteps);
    setStepIdx(0);

    const startTime = Date.now();
    const stepInterval = setInterval(() => {
      setStepIdx(prev => Math.min(prev + 1, processingSteps.length - 1));
    }, 900);

    try {
      const agentResult = await processMessage(text);
      clearInterval(stepInterval);
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsed(parseFloat(totalTime));

      const toolNames = agentResult.toolCalls.map(tc => tc.tool);
      const completedSteps: ProcessingStepData[] = [
        {
          label: 'Classifying message',
          result: agentResult.classification
            ? `Category: ${agentResult.classification.category} · Severity: ${agentResult.classification.severity}`
            : `Classified · ${toolNames.length} tools used`,
        },
        {
          label: 'Searching knowledge base',
          result: agentResult.kbMatches && agentResult.kbMatches.length > 0
            ? `Found ${agentResult.kbMatches.length} match(es) — top: ${Math.round(agentResult.kbMatches[0].score * 100)}%`
            : 'No match found above threshold',
        },
        {
          label: 'Deciding action',
          result: agentResult.decision
            ? `Action: ${agentResult.decision.action} (${Math.round(agentResult.decision.confidence * 100)}% confidence)`
            : 'Decision made',
        },
        {
          label: 'Generating output',
          result: agentResult.bugReport
            ? `Bug report drafted${agentResult.bugReport.issueNumber ? ` · GitHub #${agentResult.bugReport.issueNumber}` : ''}`
            : agentResult.response
              ? `Response drafted · ${agentResult.response.split(/\s+/).length} words`
              : 'Complete',
        },
      ];
      setSteps(completedSteps);
      setStepIdx(completedSteps.length);
      setResult(agentResult);
      setPhase('done');
    } catch {
      clearInterval(stepInterval);
      setPhase('done');
      setSteps(prev => [...prev, { label: 'Error processing message', result: 'Please try again' }]);
    }
  }, [text]);

  function reset() {
    setPhase('idle');
    setStepIdx(0);
    setSteps([]);
    setResult(null);
  }

  function handleNav(id: string) {
    if (id === 'feed') router.push('/');
    else if (id === 'notion') window.open('https://www.notion.so', '_blank');
    else if (id === 'github') window.open('https://github.com', '_blank');
  }

  return (
    <Shell
      active="intake"
      onNav={handleNav}
      eyebrow="Support"
      title="Manual intake"
      tabs={
        <TabBar
          value="intake"
          onChange={(v) => v === 'feed' ? router.push('/') : null}
          tabs={[
            { id: 'feed', label: 'Ticket Feed' },
            { id: 'intake', label: 'Manual Intake' },
          ]}
        />
      }
      headerRight={
        <div className="hidden md:flex items-center gap-3 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-low pulse-dot" /> Agent online
          </span>
        </div>
      }
    >
      <div className="px-8 py-6 grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="flex flex-col gap-5 min-w-0">
          <Card padded={false}>
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-line">
              <div>
                <div className="text-[11px] tracking-wide font-medium text-muted2 uppercase">New ticket</div>
                <div className="text-[11.5px] text-muted mt-0.5">
                  Paste a customer message from Slack, email, or anywhere else.
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10.5px] font-mono text-muted2">
                <span>plaintext · markdown ok</span>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste customer message..."
              rows={8}
              disabled={phase === 'running'}
              className={`w-full bg-transparent p-5 text-[14px] leading-relaxed text-ink resize-none ring-focus placeholder:text-muted3 ${
                phase !== 'idle' ? 'text-muted2' : ''
              }`}
            />
            <div className="px-5 py-3 border-t border-line flex items-center justify-between bg-surface/60">
              <div className="flex items-center gap-3 text-[11.5px] text-muted">
                <span>{text.length} chars · {text.split(/\s+/).filter(Boolean).length} words</span>
                <span className="w-px h-3 bg-line" />
                <span className="flex items-center gap-1.5">
                  <I.Database className="w-3 h-3" /> KB synced
                </span>
                <span className="w-px h-3 bg-line" />
                <span>PII auto-redacted</span>
              </div>
              <div className="flex items-center gap-2">
                {phase !== 'idle' && <Btn size="md" variant="ghost" onClick={reset}>Reset</Btn>}
                <Btn
                  size="md"
                  variant="primary"
                  onClick={run}
                  disabled={phase === 'running' || !text.trim()}
                  className={phase === 'running' ? 'opacity-70 cursor-wait' : ''}
                  icon={phase === 'running'
                    ? <I.Spinner className="w-3.5 h-3.5" />
                    : <I.Bolt className="w-3.5 h-3.5" />
                  }
                >
                  {phase === 'running' ? 'Processing...' : phase === 'done' ? 'Process again' : 'Process'}
                  <span className="ml-1 flex items-center gap-1 text-white/70">
                    <KBD>&#8984;</KBD><KBD>&#8629;</KBD>
                  </span>
                </Btn>
              </div>
            </div>
          </Card>

          {phase !== 'idle' && (
            <Card className="fade-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase">
                    {phase === 'running' ? 'Agent thinking' : 'Agent reasoning'}
                  </h3>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    gemini-2.5-flash · {phase === 'done' ? `${elapsed}s total` : 'in progress'}
                  </div>
                </div>
                {phase === 'done' && <I.Check className="w-4 h-4 text-low" />}
              </div>
              <div className="flex flex-col gap-3">
                {steps.map((s, i) => {
                  const state = i < stepIdx ? 'done' : i === stepIdx && phase === 'running' ? 'running' : phase === 'done' ? 'done' : 'pending';
                  if (i > stepIdx && phase === 'running') return null;
                  return <ProcessingStep key={i} step={s} state={state} />;
                })}
              </div>
            </Card>
          )}

          {result?.bugReport && <BugReportBlock bug={result.bugReport} />}

          {result?.response && !result.bugReport && (
            <Card padded={false}>
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-line">
                <div>
                  <div className="text-[11px] tracking-wide font-medium text-muted2 uppercase">Draft response</div>
                  <div className="text-[11.5px] text-muted mt-0.5">Generated from agent · ready to send</div>
                </div>
                <div className="flex items-center gap-2">
                  <Btn size="sm" variant="ghost" icon={<I.Refresh className="w-3.5 h-3.5" />}>Regenerate</Btn>
                </div>
              </div>
              <div className="p-5">
                <div className="w-full bg-surface border border-line rounded-md p-4 text-[14px] leading-[1.65] text-ink2 whitespace-pre-wrap">
                  {result.response}
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-line flex items-center justify-end bg-surface/60">
                <CopyButton text={result.response} label="Copy to Clipboard" size="md" variant="primary" />
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase mb-3">How this works</h3>
            <ol className="space-y-2.5 text-[12.5px] text-ink2">
              {[
                ['Classify', 'Category, severity, surface, root-cause hypothesis.'],
                ['Search KB', 'Vector + lexical recall over the article corpus.'],
                ['Decide', 'Draft from KB, suggest a match, file a bug, or track new.'],
                ['Compound', 'Resolved tickets feed back into the KB.'],
              ].map(([k, v], i) => (
                <li key={k} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-md bg-accent-bg text-accent text-[11px] font-mono font-semibold flex items-center justify-center border border-accent-line">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-ink font-medium leading-tight">{k}</div>
                    <div className="text-muted leading-snug">{v}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h3 className="text-[11px] tracking-wide font-medium text-muted2 uppercase mb-3">Try a sample</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { kind: 'KB match', msg: 'Hey, we connected our GitHub org to Weave on Monday but the dashboard is still completely empty...', sample: SAMPLE_TICKET },
                { kind: 'Bug report', msg: 'Our dashboard is showing an error 500 when we click on the AI Insights tab...', sample: SAMPLE_BUG_MSG },
                { kind: 'New issue', msg: 'Is there a way to exclude certain repos from the Weave Score calculation?', sample: SAMPLE_NEW_ISSUE },
              ].map(s => (
                <button key={s.kind} onClick={() => { setText(s.sample); reset(); }}
                  className="text-left p-2.5 rounded-md border border-line hover:border-line2 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10.5px] tracking-wide font-medium text-accent">{s.kind}</span>
                  </div>
                  <div className="text-[12px] text-muted line-clamp-2 leading-snug">{s.msg}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
