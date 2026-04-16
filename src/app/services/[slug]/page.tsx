import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServiceBySlug, getAllServiceSlugs } from '@/lib/data/services';
import { getReviews } from '@/lib/data/shared';
import { ServicesHeroSection } from '@/components/sections/ServicesHeroSection';
import { ServiceContentSection } from '@/components/sections/ServiceContentSection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { WhySosSection } from '@/components/sections/WhySosSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { CtaSection } from '@/components/sections/CtaSection';

export async function generateStaticParams() {
  return getAllServiceSlugs().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.metaDescription,
    alternates: { canonical: service.canonicalUrl },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const reviews = getReviews();

  return (
    <>
      <ServicesHeroSection
        title={service.heroTitle}
        subtitle={service.heroSubtitle}
        backgroundImage={service.heroImage || undefined}
      />

      {service.sections.map((section, i) => (
        <ServiceContentSection
          key={i}
          title={section.title}
          content={section.content}
          image={section.image || undefined}
          imagePosition={i % 2 === 0 ? 'right' : 'left'}
        />
      ))}

      <WhySosSection />
      <ReviewsSection reviews={reviews} />

      {service.faq.length > 0 && <FaqSection items={service.faq} />}

      <CtaSection />
    </>
  );
}
