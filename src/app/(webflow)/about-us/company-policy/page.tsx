import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';

export const metadata: Metadata = {
  description:
    'SOS Moving & Storage company policy — liability limits, payment terms, service requirements, insurance coverage, and dispute resolution. Read before booking.',
};

export default function Page() {
  return renderPage('about-us__company-policy');
}
