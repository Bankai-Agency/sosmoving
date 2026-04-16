import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { getReviews } from '@/lib/data/shared';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Read reviews from satisfied SOS Moving & Storage customers. 4.9★ rated across Google, Yelp, Trustpilot, and BBB.',
};

export default function ReviewsPage() {
  const reviews = getReviews();

  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Customer Reviews
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            See what our customers say about their experience with SOS Moving.
          </p>
        </Container>
      </section>

      <ReviewsSection reviews={reviews} />
      <CtaSection />
    </>
  );
}
