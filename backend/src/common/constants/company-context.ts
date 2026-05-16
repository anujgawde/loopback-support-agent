import { readFileSync } from 'fs';
import { join } from 'path';

const CONTEXT_FILE = join(__dirname, '..', '..', '..', 'company-context.txt');
const FALLBACK = 'No company context provided. Add your company details to backend/company-context.txt.';

let cached: string | null = null;

export function getCompanyContext(): string {
  if (cached !== null) return cached;
  try {
    cached = readFileSync(CONTEXT_FILE, 'utf-8').trim();
  } catch {
    cached = FALLBACK;
  }
  return cached;
}
