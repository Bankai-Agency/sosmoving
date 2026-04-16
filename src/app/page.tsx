import { HeroSection } from '@/components/sections/HeroSection';
import { AboutCompanySection } from '@/components/sections/AboutCompanySection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { WhySosSection } from '@/components/sections/WhySosSection';
import { ServicesGridSection } from '@/components/sections/ServicesGridSection';
import { LatestNewsSection } from '@/components/sections/LatestNewsSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { getReviews, getFAQ } from '@/lib/data/shared';
import { getBlogPosts } from '@/lib/data/blog';
import { generateMovingCompanyLD } from '@/lib/seo/structured-data';

export default function HomePage() {
  const reviews = getReviews();
  const faq = getFAQ();
  const { posts: latestPosts } = getBlogPosts({ limit: 6 });
  const jsonLd = generateMovingCompanyLD();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection
        title="SOS Moving Company in Los Angeles"
        subtitle="Full-service local and interstate movers in Los Angeles, Seattle and Portland."
        backgroundImage="/images/general/bg-poster-00001.jpg"
      />
      <AboutCompanySection />
      <ReviewsSection reviews={reviews} />
      <WhySosSection />
      <ServicesGridSection />
      <LatestNewsSection posts={latestPosts} />
      <FaqSection items={faq} />
      <CtaSection />
    </>
  );
}
