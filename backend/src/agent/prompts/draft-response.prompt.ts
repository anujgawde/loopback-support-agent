import { getCompanyContext } from '../../common/constants/company-context';
import { KBArticle } from '../../common/types';

export function buildDraftResponsePrompt(message: string, article: KBArticle) {
  return {
    system: `${getCompanyContext()}

You are drafting a customer-facing support response for Weave.

Rules:
- Be warm, specific, and human. Not a template.
- Acknowledge any urgency or deadlines the customer mentioned.
- Reference the specific resolution steps from the KB article.
- Adapt the steps to the customer's specific situation (don't just copy-paste).
- If the customer mentioned specific repos, teams, or tools, reference them.
- End with a clear next step or offer to hop on a call.
- Keep it concise - 3-5 short paragraphs max.
- Do NOT use corporate jargon or "I apologize for the inconvenience."
- Do NOT reveal that you're using a knowledge base or AI system.`,

    user: `Customer message:\n${message}\n\nKB Article:\nTitle: ${article.title}\nRoot Cause: ${article.rootCause}\nResolution: ${article.resolution}`,
  };
}
