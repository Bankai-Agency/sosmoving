import type { Metadata } from 'next';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { WhySosSection } from '@/components/sections/WhySosSection';
import { ServicesGridSection } from '@/components/sections/ServicesGridSection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { getReviews } from '@/lib/data/shared';

export const metadata: Metadata = {
  title: 'About SOS Moving & Storage',
  description:
    'Learn about SOS Moving & Storage — a professional, licensed, and insured moving company headquartered in Los Angeles, California. Founded in 2019.',
};

export default function AboutPage() {
  const reviews = getReviews();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[5rem] pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-card-bg to-black z-10" />
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/general/645ab1d97922876aaf5bef8b_company-img-1.webp"
            alt="SOS Moving team"
            fill
            className="object-cover"
          />
        </div>
        <Container className="relative z-20">
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-4">
            About SOS Moving
            <br />& Storage
          </h1>
        </Container>
      </section>

      {/* Who We Are */}
      <section className="py-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1">
              <h2 className="text-[1.5rem] font-bold mb-6">Who We Are</h2>
              <div className="text-[0.75rem] leading-relaxed space-y-4">
                <p>
                  SOS Moving & Storage is a professional, licensed, and insured
                  moving company headquartered in Los Angeles, California.
                  Founded by Alex Zack in 2019, we started with a simple goal:
                  deliver a moving experience that is safe, organized, and sound
                  — the three principles behind our name.
                </p>
                <p>
                  From day one, every team member at SOS Moving has shared a
                  commitment to treating your belongings with the same care and
                  respect as their own. That commitment has helped us grow from a
                  small local operation to a company trusted by thousands of
                  families and businesses across multiple states.
                </p>
                <p>
                  Today, SOS Moving serves clients throughout Southern
                  California, Oregon, Washington, and Colorado, completing over
                  10,000 successful moves. We specialize in local and
                  long-distance residential moves, commercial relocations,
                  packing services, white-glove handling, and secure storage
                  solutions.
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src="/images/general/645ab1d97922876aaf5bef8b_company-img-1.webp"
                  alt="SOS Moving truck"
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-8">
                <Image
                  src="/images/general/645ab1d9792287bc985bef88_company-img-4.webp"
                  alt="SOS Moving crew"
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-10 bg-surface">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '10,000+', label: 'Successful Moves' },
              { value: '2019', label: 'Founded' },
              { value: '20+', label: 'Cities Served' },
              { value: '4.9★', label: 'Average Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-accent text-[1.8rem] font-black">
                  {stat.value}
                </div>
                <div className="text-[0.65rem] text-text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <WhySosSection />
      <ReviewsSection reviews={reviews} />
      <ServicesGridSection />
      <CtaSection />
    </>
  );
}
