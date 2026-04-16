import { readFileSync } from 'fs';
import { join } from 'path';
import type { CompanyInfo, Review, FaqItem } from '@/lib/types';

const SHARED_DIR = join(process.cwd(), 'src/data/shared');

export function getCompanyInfo(): CompanyInfo {
  const data = readFileSync(join(SHARED_DIR, 'company.json'), 'utf-8');
  return JSON.parse(data);
}

export function getReviews(): Review[] {
  try {
    const data = readFileSync(join(SHARED_DIR, 'reviews.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getFAQ(): FaqItem[] {
  try {
    const data = readFileSync(join(SHARED_DIR, 'faq.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getCategories(): string[] {
  try {
    const data = readFileSync(join(SHARED_DIR, 'categories.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
