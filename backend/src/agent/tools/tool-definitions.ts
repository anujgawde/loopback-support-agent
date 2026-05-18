export const AGENT_TOOLS = [
  {
    name: 'search_kb',
    description:
      'Search the knowledge base for articles matching a customer issue. Use this when you need to find if a similar issue has been documented before. Returns matched articles with similarity scores.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            "The search query — use the customer's symptoms or description of their problem",
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'draft_response',
    description:
      "Draft a customer-facing support response. Use this after finding a KB match to generate a warm, specific reply. The response adapts the KB article's resolution to the customer's specific situation.",
    parameters: {
      type: 'object',
      properties: {
        customerMessage: {
          type: 'string',
          description: 'The original customer message',
        },
        kbArticleId: {
          type: 'string',
          description:
            'The Notion page ID of the matched KB article to base the response on',
        },
      },
      required: ['customerMessage', 'kbArticleId'],
    },
  },
  {
    name: 'generate_bug_report',
    description:
      "Generate a structured bug report for the engineering team. Use this when the issue appears to be a software bug (errors, crashes, unexpected behavior) that isn't documented in the KB.",
    parameters: {
      type: 'object',
      properties: {
        customerMessage: {
          type: 'string',
          description: 'The original customer message describing the bug',
        },
        category: {
          type: 'string',
          description:
            'Issue category: Integration | Metrics | Auth | AI Attribution | Sync | Account | Other',
        },
        severity: {
          type: 'string',
          description: 'Severity: critical | high | medium | low',
        },
      },
      required: ['customerMessage', 'category', 'severity'],
    },
  },
  {
    name: 'create_github_issue',
    description:
      "Create a GitHub Issue from a bug report. Use this after generating a bug report to file it directly in the engineering team's repository.",
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Issue title',
        },
        body: {
          type: 'string',
          description: 'Full issue body in markdown',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: "GitHub issue labels e.g. ['bug', 'priority:high']",
        },
      },
      required: ['title', 'body', 'labels'],
    },
  },
  {
    name: 'create_kb_article',
    description:
      'Create a new knowledge base article. Use this when a new type of issue has been resolved and should be documented for future reference.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        symptoms: {
          type: 'string',
          description: 'What the customer sees — in customer language',
        },
        rootCause: { type: 'string', description: 'Technical root cause' },
        resolution: { type: 'string', description: 'Step-by-step fix' },
        triggerPhrases: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Short 2-5 word phrases customers use to describe this issue',
        },
      },
      required: [
        'title',
        'category',
        'symptoms',
        'rootCause',
        'resolution',
        'triggerPhrases',
      ],
    },
  },
  {
    name: 'update_kb_article',
    description:
      'Update an existing KB article. Use this to bump frequency when a known issue recurs, add new trigger phrases, or update resolution steps.',
    parameters: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'Notion page ID of the article to update',
        },
        frequencyBump: {
          type: 'boolean',
          description: 'Whether to increment the frequency counter',
        },
        newTriggerPhrases: {
          type: 'array',
          items: { type: 'string' },
          description: 'New trigger phrases to add',
        },
        updatedResolution: {
          type: 'string',
          description: 'Updated resolution text, if needed',
        },
      },
      required: ['articleId'],
    },
  },
];
