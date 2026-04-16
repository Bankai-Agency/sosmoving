import { readFileSync } from 'fs';
import { join } from 'path';
import type { ServiceData } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'src/data/services');

export function getServiceBySlug(slug: string): ServiceData | null {
  try {
    const data = readFileSync(join(DATA_DIR, `${slug}.json`), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getAllServiceSlugs(): { slug: string; title: string }[] {
  try {
    const data = readFileSync(join(DATA_DIR, '_registry.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
