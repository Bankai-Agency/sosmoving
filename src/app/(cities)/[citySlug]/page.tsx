import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCityBySlug, getAllCitySlugs } from '@/lib/data/cities';
import { getReviews } from '@/lib/data/shared';
import { ServicesHeroSection } from '@/components/sections/ServicesHeroSection';
import { ServiceContentSection } from '@/components/sections/ServiceContentSection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { WhySosSection } from '@/components/sections/WhySosSection';
import { ServicesGridSection } from '@/components/sections/ServicesGridSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { CtaSection } from '@/components/sections/CtaSection';

export async function generateStaticParams() {
  const slugs = getAllCitySlugs();
  return slugs
    .filter((s) => !s.parentSlug)
    .map((s) => ({ citySlug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return {
    title: city.title,
    description: city.metaDescription,
    alternates: { canonical: city.canonicalUrl },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const reviews = getReviews();

  return (
    <>
      <ServicesHeroSection
        title={city.heroTitle}
        subtitle={city.heroSubtitle}
        backgroundImage={city.heroImage || undefined}
      />

      {city.sections.map((section, i) => (
        <ServiceContentSection
          key={i}
          title={section.title}
          content={section.content}
          image={section.image || undefined}
          imagePosition={i % 2 === 0 ? 'right' : 'left'}
        />
      ))}

      <ServicesGridSection />
      <WhySosSection />
      <ReviewsSection reviews={reviews} />

      {city.faq.length > 0 && <FaqSection items={city.faq} />}

      <CtaSection />
    </>
  );
}
