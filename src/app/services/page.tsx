import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ServicesGridSection } from '@/components/sections/ServicesGridSection';
import { WhySosSection } from '@/components/sections/WhySosSection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { getReviews } from '@/lib/data/shared';

export const metadata: Metadata = {
  title: 'Moving Services',
  description: 'SOS Moving offers apartment moving, commercial moving, long-distance, packing, white glove, and storage services in Los Angeles and beyond.',
};

export default function ServicesPage() {
  const reviews = getReviews();

  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Our Moving Services
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            Comprehensive moving solutions for every need — from studio apartments to corporate offices.
          </p>
        </Container>
      </section>

      <ServicesGridSection />
      <WhySosSection />
      <ReviewsSection reviews={reviews} />
      <CtaSection />
    </>
  );
}
