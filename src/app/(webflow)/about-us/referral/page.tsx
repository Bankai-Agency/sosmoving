import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us/referral', {
  description:
    'Refer friends to SOS Moving and earn 10% cash back on their move. Get paid via Zelle, Venmo, or CashApp. No limits on referrals.',
});

export default function Page() {
  return renderPage('about-us__referral');
}
