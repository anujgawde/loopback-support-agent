import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KBService } from '../kb/kb.service';
import { KBArticle } from '../common/types';

type SeedArticle = Omit<KBArticle, 'id' | 'notionUrl'>;

function buildSeedArticles(company: string): SeedArticle[] {
  return [
    {
      title: 'Third-Party Integration — No Data Appearing',
      category: 'Integration',
      symptoms:
        `Customer connected their third-party account but the ${company} dashboard shows no data, no activity. Often reported within 24-48 hours of initial setup.`,
      rootCause:
        `Most common: OAuth app not installed on the correct account, or installed with limited scope/access. Second most common: webhooks failing silently due to network-level IP allowlists blocking ${company} endpoints.`,
      resolution:
        `1. Verify the OAuth app is installed on the correct account with full required scopes. 2. Confirm access permissions cover the correct resources. 3. Check any IP allowlist — ${company} endpoints must be whitelisted. 4. Verify webhook deliveries in the third-party settings. 5. If all looks correct, wait 24-48h for initial data ingestion. 6. Escalate to engineering if webhooks show 4xx/5xx responses.`,
      triggerPhrases: [
        'no data after connecting',
        'dashboard empty',
        'connected but nothing showing',
        'not pulling data',
        'zero activity',
      ],
      frequency: 47,
      lastSeen: '2025-06-10',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Metrics Seem Inaccurate or Unexpected',
      category: 'Metrics',
      symptoms:
        `Customer reports ${company} metrics don't match their expectations. Common complaints: "user X did a lot but has low score", "metrics dropped suddenly", "new members show higher metrics than veterans".`,
      rootCause:
        'Metrics measure quality-adjusted work, not raw volume. Common misunderstandings: 1) High-volume but simple activity scores lower than low-volume complex activity. 2) Metrics need sufficient historical data to calibrate. 3) Different activity types are weighted differently.',
      resolution:
        '1. Explain that metrics measure quality and complexity, not raw volume. 2. Check if the account has enough historical data (metrics need time to stabilize). 3. Verify configuration is correct for all tracked activity types. 4. Suggest comparing trends over 4+ weeks rather than single-week snapshots. 5. If fundamentally off, engineering can investigate the scoring model calibration.',
      triggerPhrases: [
        'score seems wrong',
        'inaccurate metrics',
        'numbers too low',
        'metrics dropped',
        'data doesnt match',
      ],
      frequency: 35,
      lastSeen: '2025-06-12',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Tool Attribution Not Appearing',
      category: 'AI Attribution',
      symptoms:
        `Customer has team members using specific tools but the ${company} insights dashboard shows no attribution data or reports 0% usage.`,
      rootCause:
        'Each tracked tool requires specific configuration for detection and attribution. Most common: user identity config not set, telemetry not enabled at org level, or the detection feature not enabled in settings.',
      resolution:
        '1. Check which tools the team uses. 2. Verify each tool has proper identity/email configuration matching the user profile. 3. Confirm org-level telemetry sharing is enabled where required. 4. In settings, ensure detection features are toggled on. 5. Data appears within 24-48h after correct configuration. 6. Share the relevant setup guide.',
      triggerPhrases: [
        'tools not showing',
        'attribution missing',
        'usage zero',
        'no insights data',
        'tool not detected',
      ],
      frequency: 28,
      lastSeen: '2025-06-14',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'SSO Login Issues for New Team Members',
      category: 'Auth',
      symptoms:
        'New team members on Enterprise plan cannot log in via SSO. Error messages vary: "account not found", "SSO configuration error", or redirect loops.',
      rootCause:
        `Enterprise SSO requires SCIM provisioning to be fully synced before login works. New users added to the IdP (Okta, Azure AD, etc.) may not yet be provisioned in ${company}. Also: email domain mismatch between IdP and org settings.`,
      resolution:
        `1. Confirm the user exists in the IdP group assigned to ${company}. 2. Check SCIM provisioning logs — is the user synced? 3. Verify email domain matches the ${company} org domain. 4. If SCIM shows synced but login fails, check for email case sensitivity issues. 5. Try a manual SCIM sync push from the IdP. 6. If redirect loops, clear browser cookies and try incognito. 7. Escalate to engineering if SCIM sync is failing at the API level.`,
      triggerPhrases: [
        'cant login sso',
        'new member access denied',
        'sso not working',
        'scim sync failed',
        'login redirect loop',
      ],
      frequency: 19,
      lastSeen: '2025-06-08',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Data Sync Delays — Dashboard Shows Stale Data',
      category: 'Sync',
      symptoms:
        'Dashboard data is hours or days behind. Recent activity doesn\'t appear. Customer sees "last updated X hours ago" warning.',
      rootCause:
        'The system processes data in near-real-time via webhooks, but heavy load or API rate limiting can cause delays. Also: if the customer recently added many data sources, the backfill queue may be congested.',
      resolution:
        `1. Check the "Last Synced" timestamp in ${company} settings. 2. If <4 hours behind, this is within normal range during high-traffic periods. 3. If >24 hours behind, check for webhook delivery failures. 4. If recently added many data sources, backfill can take 24-72h. 5. Verify no API rate limit exhaustion. 6. If persistent, escalate — engineering can check the ingestion pipeline health.`,
      triggerPhrases: [
        'stale data',
        'data not updating',
        'dashboard behind',
        'sync delayed',
        'old data showing',
      ],
      frequency: 22,
      lastSeen: '2025-06-13',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Benchmark Comparisons Seem Inaccurate',
      category: 'Metrics',
      symptoms:
        'Customer feels benchmark comparisons are unfair. Common: "We\'re being compared to teams 5x our size", "Benchmarks show we\'re underperforming but we know we\'re productive".',
      rootCause:
        'Benchmarks need sufficient historical data to properly calibrate cohort matching. Before that, comparisons use broader cohorts that may not be representative. Also: team size classification happens at onboarding and may need manual adjustment.',
      resolution:
        '1. Check how long the customer has been active (need sufficient weeks for accurate benchmarks). 2. Verify team size classification is correct in org settings. 3. Explain that benchmarks compare against teams with similar size and profile. 4. If new, set expectation that benchmarks will become more accurate over time. 5. If sufficient data exists and still off, engineering can review cohort matching for this org.',
      triggerPhrases: [
        'benchmarks wrong',
        'unfair comparison',
        'benchmark inaccurate',
        'compared to wrong teams',
        'benchmark doesnt make sense',
      ],
      frequency: 15,
      lastSeen: '2025-06-05',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Users Missing from Dashboard',
      category: 'Integration',
      symptoms:
        `Some users who are active don't appear on the ${company} dashboard. Their activity exists in the connected platform but the system doesn't show them.`,
      rootCause:
        `${company} matches users by email. If a user has a different email in their tool config than what's in their ${company} profile, they won't be matched. Also: users on excluded resources or using alias accounts may not appear.`,
      resolution:
        `1. Check the user's email configuration in their tools. 2. Compare against their ${company} profile email. 3. If different, they can either: a) Update tool config to match ${company} email, or b) Add the alternate email in profile settings. 4. Check if their resources are included in the integration scope. 5. Verify they have qualifying activity (draft/pending items may not count). 6. Bot or automation accounts are excluded by default.`,
      triggerPhrases: [
        'user not showing up',
        'missing from dashboard',
        'member not found',
        'person not appearing',
        'team member missing',
      ],
      frequency: 25,
      lastSeen: '2025-06-11',
      relatedGithubIssues: '',
      status: 'Active',
    },
    {
      title: 'Enterprise Multi-Organization Setup',
      category: 'Account',
      symptoms:
        'Enterprise customer needs to manage multiple orgs/teams/subsidiaries under one billing account. Confusion about how to structure organizations, share data across orgs, or manage permissions across business units.',
      rootCause:
        'Multi-org is an Enterprise-only feature with specific setup requirements. Each org has isolated data by default. Cross-org views require explicit configuration. Admin permissions don\'t cascade across orgs automatically.',
      resolution:
        '1. Confirm customer is on Enterprise plan (multi-org is Enterprise-only). 2. Explain the org hierarchy: parent org → child orgs, each with isolated data. 3. Help plan org structure: usually one org per business unit or major product team. 4. Set up org admin permissions (parent org admins can be granted cross-org view access). 5. Configure SSO/SCIM per org if using different IdPs per business unit. 6. For cross-org reporting, enable consolidated view in Enterprise settings. 7. Schedule a setup call for complex multi-org deployments.',
      triggerPhrases: [
        'multiple orgs',
        'multi org setup',
        'separate teams billing',
        'cross org access',
        'enterprise org structure',
      ],
      frequency: 8,
      lastSeen: '2025-05-28',
      relatedGithubIssues: '',
      status: 'Active',
    },
  ];
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private kbService: KBService,
    private configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    const company = this.configService.get<string>('COMPANY_NAME') || 'YourCompany';
    const articles = buildSeedArticles(company);

    this.logger.log(`Seeding ${articles.length} KB articles for "${company}"...`);

    for (let i = 0; i < articles.length; i++) {
      const draft = articles[i];
      this.logger.log(`  [${i + 1}/${articles.length}] ${draft.title}`);
      await this.kbService.createArticle(draft);
    }

    this.logger.log('Seed complete.');
  }
}
