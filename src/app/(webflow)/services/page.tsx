import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';

export const metadata: Metadata = {
  description:
    'SOS Moving services in Los Angeles — apartment, commercial, long-distance, packing, white glove, and storage. Licensed & insured. From $119/hr.',
};

export default function Page() {
  return renderPage('services');
}
