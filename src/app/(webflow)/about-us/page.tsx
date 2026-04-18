import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';

export const metadata: Metadata = {
  description:
    'Learn about SOS Moving Company, a professional, licensed, and insured moving company founded in Los Angeles in 2019 and expanded to San Francisco in 2021.',
};

export default function Page() {
  return renderPage('about-us');
}
