# Loopback

A support agent that reads customer messages, searches a knowledge base, drafts replies, and files GitHub Issues when it finds bugs. It runs on Slack and a web dashboard.

This is a tool for support engineers, not a customer-facing chatbot. Loopback drafts responses and files bugs. The human reviews, edits if needed, and sends. Nothing goes out without a person in the loop.

Everything runs on free tiers. No credit card required to get this running.

## What happens when a message comes in

Say a customer writes: _"We connected GitHub on Monday but the dashboard is still empty."_

Loopback doesn't follow a hardcoded if/else pipeline. It's a tool-calling agent built on LLM function calling. The LLM gets the message, a system prompt with your company's context, and a set of six tools. Then it decides what to do.

Here's the typical path for that message:

1. The LLM calls `search_kb` with the customer's symptoms as the query
2. The embedding service converts the query to a 384-dimensional vector using a local MiniLM model
3. Qdrant runs a similarity search and returns the top matches with scores
4. The LLM sees a strong match ("Third-Party Integration — No Data Appearing", 0.89 confidence)
5. It calls `draft_response` with the customer message and the matched article's Notion page ID
6. A second LLM call generates a warm, specific reply adapted to the customer's situation
7. It calls `update_kb_article` to bump the frequency counter and record today's date
8. The LLM returns the draft as its final text response

But the LLM can go off-script. It might search twice with different phrasings if the first query comes back weak. It might decompose a multi-issue message and handle each part separately. If it sees a 500 error in the customer's message and nothing in the KB, it'll generate a structured bug report and file a GitHub Issue without being told to. The code doesn't prescribe these decisions. It runs a loop: send context to the LLM, execute whatever tool calls come back, feed the results in, repeat until the LLM produces a final text response. There's a safety cap at 10 iterations.

The whole trace (which tools were called, what arguments, what came back) gets logged to a Support Log in Notion and is visible in the dashboard. If the agent generates a bug report, it auto-files it as a GitHub Issue and posts the link back in the Slack thread.

### The six tools

`search_kb` — Takes a natural language query, embeds it, and runs vector similarity search against the knowledge base in Qdrant. Returns matched articles with similarity scores. This is almost always the first tool the agent calls.

`draft_response` — Takes the original customer message and a KB article ID. Makes a second LLM call that reads the article's resolution steps and writes a customer-facing reply adapted to their specific situation. The agent's final output uses this draft, not a raw copy of the KB article.

`generate_bug_report` — Takes the customer message, a category, and a severity level. Produces a structured report with title, description, repro steps, expected vs. actual behavior, environment details, customer impact, and suggested labels. Output is JSON that maps directly to a GitHub Issue.

`create_github_issue` — Takes a title, markdown body, and labels. Files a real GitHub Issue via Octokit. Returns the issue URL and number. If the agent calls `generate_bug_report` but doesn't follow up with this tool, the backend auto-files the issue anyway as a safety net.

`create_kb_article` — Creates a new knowledge base entry in Notion with title, category, symptoms (in customer language), root cause, resolution steps, and trigger phrases. Also generates an embedding and indexes it in Qdrant so future searches can find it.

`update_kb_article` — Bumps the frequency counter on an existing article, adds new trigger phrases, or updates the resolution text. The agent calls this after resolving a ticket from a known KB article, which is how the knowledge base stays current without manual maintenance.

## Architecture

```
  SLACK (Socket Mode)                    WEB DASHBOARD (Next.js :3001)
         |                                       |
         v                                       v
+----------------------------------------------------------------+
|                     NEST.JS BACKEND (:3000)                    |
|                                                                |
|  Agent Service --> KB Service --> Embedding Service (local)    |
|       |                |                                       |
|       v                v                                       |
|  LLM Service      Qdrant Service     Notion Service           |
|  (Gemini 2.5)     (vector search)    (KB + Support Log)       |
|                                                                |
|  GitHub Service    Support Log Service    Analytics Service    |
+----------------------------------------------------------------+
         |              |            |             |
         v              v            v             v
    Gemini API     Qdrant Cloud   Notion API    GitHub API
```

The backend is NestJS with a modular service architecture. Each external integration (Notion, Qdrant, GitHub, Slack, the LLM) is its own module with its own service class. The agent service orchestrates them through the tool-calling loop.

**How the pieces connect:**

The KB service sits in the middle of three systems. When you search, it calls the embedding service to vectorize your query (locally, using `all-MiniLM-L6-v2` via `@xenova/transformers` — 384 dimensions, no API calls), then hits Qdrant for similarity search, then fetches the full article details from Notion. When you create or update an article, it writes to Notion and re-indexes the embedding in Qdrant. This keeps the vector index and the source of truth in sync without a separate reconciliation job.

The LLM service is a thin abstraction layer. It defaults to Gemini 2.5 Flash using the `@google/genai` SDK and exposes three methods: `generateWithTools` (the main one, used by the agent loop), `generateText` (used for drafting responses), and `generateJSON` (used for generating structured bug reports). The provider is swappable via the `LLM_PROVIDER` env var. Right now only Gemini is implemented but the interface is there for Claude or OpenAI.

Notion holds two databases. The **Knowledge Base** stores articles with symptoms, root causes, resolution steps, trigger phrases, and frequency counts. The **Support Log** records every ticket the agent processes: the raw customer message, what the agent did, which tools it called, confidence scores, whether a bug was filed, and the current review status. The support log is what powers the dashboard's ticket feed and analytics.

Slack uses Socket Mode via `nestjs-slack-bolt`, which means the bot connects outbound over WebSocket. No public URL, no ngrok, no tunneling needed during development. The bot listens to all messages in channels it's invited to, skips bot messages and subtypes to avoid loops, processes through the agent, and replies in a thread. If a GitHub Issue gets filed, it posts a second message in the thread with the issue link.

The frontend is a Next.js 16 app with React 19 and Tailwind 4. Dark theme, dense layout. Two main views: a ticket feed table (with filters for date, source, and status) and a manual intake form where you can paste messages and watch the agent work through them in real time. Each ticket row links to a detail view showing the full agent trace.

## Project layout

```
loopback-support-agent/
├── package.json              # npm workspaces root
├── backend/
│   ├── package.json
│   ├── company-context.example.txt
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── types/index.ts            # KBArticle, BugReport, AgentDecision, etc.
│       │   ├── config/configuration.ts   # Env var mapping
│       │   └── constants/company-context.ts  # Reads company-context.txt into LLM prompts
│       ├── agent/
│       │   ├── agent.service.ts          # The tool-calling loop (this is the interesting file)
│       │   ├── agent.controller.ts       # POST /agent/process
│       │   ├── tools/tool-definitions.ts # Six tool schemas passed to the LLM
│       │   └── prompts/                  # System prompt, draft response prompt, bug report prompt
│       ├── llm/
│       │   ├── llm.service.ts            # Provider abstraction
│       │   ├── llm-provider.interface.ts # LLMProvider interface
│       │   └── providers/gemini.provider.ts
│       ├── kb/
│       │   ├── kb.service.ts             # Orchestrates Notion + Qdrant + embeddings
│       │   └── kb.controller.ts          # GET /kb
│       ├── embedding/
│       │   └── embedding.service.ts      # Local MiniLM, loads on module init
│       ├── qdrant/
│       │   └── qdrant.service.ts         # Vector CRUD + search
│       ├── notion/
│       │   └── notion.service.ts         # CRUD for both Notion databases
│       ├── github/
│       │   └── github.service.ts         # Creates issues via Octokit
│       ├── slack/
│       │   ├── slack.controller.ts       # @Message('') listener, thread replies
│       │   └── slack.service.ts          # Block Kit formatting, error handling
│       ├── support-log/
│       │   ├── support-log.service.ts    # Logs every ticket to Notion
│       │   └── support-log.controller.ts # GET /logs, GET /logs/:id
│       ├── analytics/
│       │   └── analytics.controller.ts   # GET /analytics/stats, /analytics/config
│       └── seed/
│           ├── seed.service.ts           # 8 starter KB articles
│           └── seed.command.ts           # npm run seed entry point
│
└── frontend/
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   └── page.tsx                  # Renders FeedPage
        ├── components/
        │   ├── shell.tsx                 # App shell with sidebar nav, stats header
        │   ├── feed.tsx                  # Ticket feed table with filters
        │   ├── intake.tsx                # Manual intake form + live agent trace
        │   ├── ticket-detail.tsx         # Full ticket detail view
        │   ├── primitives.tsx            # Buttons, cards, pills, badges
        │   └── icons.tsx                 # SVG icon components
        └── lib/
            ├── api.ts                    # Backend API client
            ├── types.ts                  # Frontend type definitions
            └── tokens.ts                 # Design tokens (colors, severity mapping)
```

If you want to understand how the agent works, start with `backend/src/agent/agent.service.ts`. The `processMessage` method is the core loop. The `executeTool` switch statement shows how each tool maps to service calls. The system prompt in `backend/src/agent/prompts/agent-system.prompt.ts` defines the agent's behavior and decision-making rules.

## Setup

### What you'll need

Node 18+ and npm 9+. Plus free accounts on these services:

- **Gemini** — [Get an API key](https://aistudio.google.com/apikey). The free tier is enough.
- **Notion** — [Create an integration](https://www.notion.so/my-integrations). You'll need the integration token and two database IDs.
- **Qdrant Cloud** — [Sign up](https://cloud.qdrant.io/). Create a cluster on the free tier. You need the cluster URL and an API key.
- **GitHub** — [Generate a personal access token](https://github.com/settings/tokens) with `repo` scope. Create a repo where bug reports will be filed as issues.
- **Slack** (optional) — Only needed if you want the Slack bot. [See setup below.](#slack-setup)

### Install

```bash
git clone https://github.com/your-username/loopback-support-agent.git
cd loopback-support-agent
npm install
```

This installs both workspaces (backend + frontend) in one go.

### Environment variables

Create `backend/.env`:

```bash
# LLM
LLM_PROVIDER=gemini
GEMINI_API_KEY=

# Notion
NOTION_API_KEY=
NOTION_KB_DATABASE_ID=
NOTION_SUPPORT_LOG_DATABASE_ID=

# Qdrant
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=weave-kb

# GitHub
GITHUB_TOKEN=
GITHUB_REPO=owner/repo-name

# Slack (skip if you just want the web UI)
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=
SLACK_SOCKET_MODE=true

# App
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### Setting up Notion

You need two Notion databases. Create them as full-page databases and share both with your integration (click "..." → "Connections" → add your integration).

**Knowledge Base database** with these properties:

- Title (title)
- Category (select) — options: Integration, Metrics, Auth, AI Attribution, Sync, Account, Feature Request, Other
- Symptoms (rich text)
- Root Cause (rich text)
- Resolution (rich text)
- Trigger Phrases (rich text)
- Frequency (number)
- Last Seen (date)
- Related GitHub Issues (URL)
- Status (select) — options: Active, Resolved in Product, Outdated

**Support Log database** with these properties:

- Title (title)
- Timestamp (date)
- Customer Message (rich text)
- Source (select) — options: Slack, Web
- Agent Response (rich text)
- Tools Used (rich text)
- KB Article Matched (rich text)
- Confidence (number)
- Bug Report Filed (checkbox)
- GitHub Issue URL (URL)
- Status (select) — options: Pending Review, Sent, Resolved, Dismissed
- Slack Channel (rich text)

To get a database ID: open the database as a full page in Notion. The URL looks like `notion.so/workspace/[database-id]?v=...`. The long hex string before the `?v` is the ID.

### Company context

```bash
cp backend/company-context.example.txt backend/company-context.txt
```

Edit `company-context.txt` with your company's product description, integrations, pricing tiers, onboarding flow, and common support topics. This text gets injected into every LLM prompt, which is how the agent knows what your product does and how to talk about it. The seed data also references it, so fill this in before seeding.

### Seed the knowledge base

```bash
npm run seed
```

This creates 8 starter articles in your Notion Knowledge Base and indexes their embeddings in Qdrant. The articles cover common support scenarios (integration issues, metric confusion, SSO problems, data sync delays, etc.) and are written to be generic enough to adapt to any product through the company context file.

After seeding, check your Notion KB database. You should see 8 articles with populated fields. Check your Qdrant dashboard — the `weave-kb` collection should have 8 vectors.

### Run

Open two terminals:

```bash
# Terminal 1 — backend on port 3000
npm run backend

# Terminal 2 — frontend on port 3001
npm run frontend
```

The first startup takes 10-20 seconds while the embedding model downloads and loads into memory. You'll see `Embedding model loaded.` in the backend logs when it's ready.

Open http://localhost:3001. You'll see an empty ticket feed. Click "New ticket" or navigate to Manual Intake to process your first message.

## Slack setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps), create a new app from scratch
2. Under **OAuth & Permissions**, add these bot token scopes: `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
3. Under **Event Subscriptions**, enable events and subscribe to: `message.channels`, `message.groups`
4. Under **App-Level Tokens**, generate a token with `connections:write` scope. This is your `SLACK_APP_TOKEN`
5. Enable **Socket Mode**
6. Install to your workspace. Copy the Bot User OAuth Token (`SLACK_BOT_TOKEN`) and the Signing Secret from Basic Information (`SLACK_SIGNING_SECRET`)
7. Invite the bot to a channel: `/invite @Loopback`

When a message comes in, the bot processes it through the agent and replies in a thread. The reply includes the agent's tool path (e.g., `search_kb → draft_response → update_kb_article`) and the drafted response. If a bug report was filed, a second message appears with the GitHub Issue link. Errors get caught and the bot posts a generic error message so the channel doesn't just go silent.

## API

```
POST /agent/process
  Body: { "message": "customer message text" }
  Returns: AgentResult with response, toolCalls[], logId, classification, decision, kbMatches, bugReport

GET /logs
  Returns: All support log entries from Notion (most recent first)

GET /logs/:id
  Returns: Single log entry with full detail

GET /analytics/stats
  Returns: { totalArticles, totalResolutions, hitRate, topIssues[], categoryBreakdown[] }

GET /analytics/config
  Returns: { notionKbUrl, notionLogUrl, githubRepo } — used by the dashboard for external links

GET /kb
  Returns: All knowledge base articles
```

The `POST /agent/process` endpoint is the core of the system. The manual intake form, the Slack bot, and any future integration all call the same underlying `AgentService.processMessage()` method. To integrate Loopback with a new channel (email, Intercom, Discord, a webhook), you call this endpoint with the customer message and handle the structured response in your channel. The backend doesn't need to change — source is currently scoped to Web and Slack, and is extensible.

## Example scenarios

These are good messages to paste into the manual intake to see how the agent handles different situations:

**Known issue — the agent finds a KB match and drafts a response:**

> We connected our GitHub org to Weave on Monday but the dashboard is still completely empty. No scores, no data, nothing. Our CTO wants the first report by Friday.

The agent searches the KB, finds the integration troubleshooting article at high confidence, drafts a specific reply walking through OAuth scope verification and webhook checks, and bumps the article's frequency from 47 to 48.

**Bug — no KB match, agent files a GitHub Issue:**

> Dashboard is showing error 500 when we click AI Insights. It was working yesterday. We're on the Pro plan with 15 engineers. This is blocking our weekly engineering review.

Nothing in the KB matches a 500 error on AI Insights. The agent generates a structured bug report with severity, repro steps, customer impact, and environment details. It files a GitHub Issue with appropriate labels and returns the link.

**Multiple issues in one message:**

> Two things: new engineer can't log in via SSO, and our Cursor attribution stopped showing up.

The agent searches twice, finds both the SSO article and the AI Attribution article, drafts a combined response addressing both, and bumps frequency on each.

**Feature request — nothing to match, not a bug:**

> Is there a way to exclude certain repos from the Weave Score calculation? We have some archive repos skewing things.

No KB match, but the agent recognizes this isn't a bug. It acknowledges the request, lets the customer know it's been noted, and suggests it could be a future KB article once there's a resolution.

## Stack

NestJS backend in TypeScript. Next.js 16 frontend with React 19 and Tailwind 4. Gemini 2.5 Flash for the LLM (pluggable via a provider interface). Local embeddings with all-MiniLM-L6-v2 through `@xenova/transformers`. Qdrant Cloud for vector search. Notion API as the knowledge base and ticket store. GitHub Issues via Octokit for bug tracking. Slack Bolt with Socket Mode for the chat integration. npm workspaces monorepo.

## What this isn't

This isn't production infrastructure. It's a working demonstration of how you'd build a support agent with real integrations and a real decision-making loop. The agent doesn't auto-send anything to customers. There's no auth on the dashboard. There's no rate limiting on the API. If you wanted to deploy this for real, you'd need to add those things.
