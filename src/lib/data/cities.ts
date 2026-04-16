import { readFileSync } from 'fs';
import { join } from 'path';
import type { CityData } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'src/data/cities');

export function getCityBySlug(slug: string): CityData | null {
  try {
    const data = readFileSync(join(DATA_DIR, `${slug}.json`), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getAllCitySlugs(): { slug: string; parentSlug: string | null }[] {
  try {
    const data = readFileSync(join(DATA_DIR, '_registry.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getCitiesByParent(parentSlug: string): CityData[] {
  const registry = getAllCitySlugs();
  return registry
    .filter((c) => c.parentSlug === parentSlug)
    .map((c) => getCityBySlug(c.slug))
    .filter(Boolean) as CityData[];
}
