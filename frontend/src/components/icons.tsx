import { SVGProps } from 'react';
import { Loader2, type LucideProps } from 'lucide-react';

export {
  Inbox,
  List as Feed,
  BookOpen as Book,
  Bug,
  BarChart3 as Chart,
  Settings,
  Search,
  Zap as Bolt,
  Copy,
  Check,
  Plus,
  ChevronRight as Chevron,
  ChevronDown,
  ChevronLeft,
  ArrowRight as Arrow,
  ExternalLink as External,
  Pencil as Edit,
  RefreshCw as Refresh,
  Filter,
  Calendar,
  X,
  Clock,
  Tag,
  Sparkles as Sparkle,
  Brain,
  Database,
  Users,
  HelpCircle as Help,
  ArrowRight,
} from 'lucide-react';

export function Spinner(p: LucideProps) {
  return <Loader2 {...p} className={`spin ${p.className || ''}`} />;
}

type IconProps = SVGProps<SVGSVGElement>;

export function Logo(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#EE5734" />
      <path d="M7 6.5v9.5a1.5 1.5 0 0 0 1.5 1.5h6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 14.5l2 3 2-3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Github(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.74 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.91 0 1.38-.01 2.5-.01 2.83 0 .27.18.59.69.49C19.13 20.62 22 16.78 22 12.25 22 6.58 17.52 2 12 2z"/>
    </svg>
  );
}

export function Slack(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="10" width="6" height="2.2" rx="1.1" fill="#E01E5A"/>
      <rect x="11.8" y="4" width="2.2" height="6" rx="1.1" fill="#36C5F0"/>
      <rect x="14" y="11.8" width="6" height="2.2" rx="1.1" fill="#2EB67D"/>
      <rect x="10" y="14" width="2.2" height="6" rx="1.1" fill="#ECB22E"/>
    </svg>
  );
}

export function Notion(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 8v8M9 8l6 8M15 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
