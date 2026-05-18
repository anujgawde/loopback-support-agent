'use client';

import { type ReactNode } from 'react';
import * as I from './icons';
import { BetaBadge } from './primitives';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  kbd?: string;
  external?: string;
  beta?: boolean;
  queue?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Support',
    items: [
      { id: 'feed', label: 'Ticket Feed', icon: I.Feed, kbd: 'F', queue: 7 },
      { id: 'intake', label: 'Manual Intake', icon: I.Inbox, kbd: 'I' },
    ],
  },
  {
    title: 'External',
    items: [
      { id: 'notion', label: 'Knowledge Base', icon: I.Notion, external: 'Notion' },
      { id: 'github', label: 'Bug Reports', icon: I.Github, external: 'GitHub' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { id: 'members', label: 'Members', icon: I.Users },
      { id: 'data', label: 'Data Sources', icon: I.Database },
      { id: 'settings', label: 'Settings', icon: I.Settings },
    ],
  },
];

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-line bg-page flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <I.Logo className="w-7 h-7" />
          <span className="text-[14px] font-semibold tracking-tight text-ink">Loopback</span>
        </div>
        <button className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-300 to-rose-400 flex items-center justify-center text-white text-[11px] font-semibold ring-1 ring-line">
          EM
        </button>
      </div>

      <nav className="px-3 pt-1 pb-2 flex flex-col gap-3">
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <div className="text-[10.5px] tracking-wide font-medium text-muted2 px-2 mb-1">{group.title}</div>
            <div className="flex flex-col gap-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNav(item.id)}
                    className={`group flex items-center gap-2.5 h-[30px] px-2 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-sunken text-ink font-medium'
                        : 'text-ink2 hover:text-ink hover:bg-sunken/70'
                    }`}
                  >
                    <Icon className="w-[15px] h-[15px] text-muted2" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.external && (
                      <I.External className="w-3 h-3 text-muted2 group-hover:text-muted" />
                    )}
                    {item.beta && <BetaBadge />}
                    {item.queue ? (
                      <span className="text-[10.5px] font-mono text-muted2 group-hover:text-muted">{item.queue}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-md border border-line bg-surface p-2.5">
          <div className="text-[11px] text-ink2 font-medium mb-0.5">KB compounding</div>
          <div className="text-[10.5px] text-muted">3 articles updated today from resolved tickets</div>
          <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-accent">
            <I.Sparkle className="w-3 h-3" /> Auto-sync on
          </div>
        </div>
      </div>
    </aside>
  );
}

function HeaderStats() {
  return (
    <div className="hidden md:flex items-center gap-3 text-[12px] text-muted">
      <span><span className="text-ink font-medium">8</span> articles</span>
      <span className="w-1 h-1 rounded-full bg-muted3" />
      <span><span className="text-ink font-medium">47</span> resolutions</span>
      <span className="w-1 h-1 rounded-full bg-muted3" />
      <span><span className="text-ink font-medium">78%</span> hit rate</span>
    </div>
  );
}

export function Shell({
  active,
  onNav,
  title,
  breadcrumb,
  eyebrow,
  headerRight,
  children,
  filters,
  tabs,
}: {
  active: string;
  onNav: (id: string) => void;
  title: string;
  breadcrumb?: ReactNode;
  eyebrow?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  filters?: ReactNode;
  tabs?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-page">
      <Sidebar active={active} onNav={onNav} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-7 px-4 flex items-center justify-between bg-accent text-white text-[11.5px]">
          <span className="opacity-90 font-mono">support · workspace: weave-internal</span>
          <span className="opacity-90">Logged in as Elena Marsh · <span className="underline-offset-2 hover:underline cursor-pointer">switch</span></span>
        </div>

        <header className="px-8 pt-6 pb-3 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <div className="text-[11px] tracking-wide font-medium text-muted2 mb-1.5">{eyebrow}</div>
              )}
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
                {breadcrumb}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HeaderStats />
              {headerRight}
            </div>
          </div>
          {tabs && <div className="mt-4">{tabs}</div>}
          {filters && <div className="mt-3 flex items-center gap-2 flex-wrap">{filters}</div>}
        </header>

        <main className="flex-1 min-w-0 bg-page">{children}</main>
      </div>
    </div>
  );
}
