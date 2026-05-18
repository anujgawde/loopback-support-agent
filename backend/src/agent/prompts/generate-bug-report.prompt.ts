import { getCompanyContext } from '../../common/constants/company-context';

export function buildBugReportPrompt(
  message: string,
  category: string,
  severity: string,
) {
  return {
    system: `${getCompanyContext()}

You are generating a structured bug report from a customer support message for the Weave engineering team.

Return a JSON object with:
- title: Clear, specific bug title
- severity: from the provided severity
- description: What the customer reported
- stepsToReproduce: Array of steps (infer from context if not explicit)
- expectedBehavior: What should happen
- actualBehavior: What actually happens
- environment: { plan, integrations, teamSize, relevantConfig }
- customerImpact: Business impact statement
- suggestedLabels: Array of GitHub issue labels
- markdownBody: Complete GitHub issue body in markdown with all sections

Respond with ONLY valid JSON. No markdown fences.`,

    user: `Customer message:\n${message}\n\nCategory: ${category}\nSeverity: ${severity}`,
  };
}
