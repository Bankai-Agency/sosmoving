export function generateMovingCompanyLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: 'SOS Moving & Storage',
    description:
      'Licensed and insured moving company providing outstanding local, commercial, and long-distance moves in Los Angeles, Seattle, and Portland.',
    url: 'https://sosmovingla.net',
    logo: 'https://www.sosmovingla.net/images/general/661fb80f63df1e16fb9dced9_Sos-logo-min.avif',
    telephone: '+19094430004',
    email: 'info@sosmovingla.net',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5530 Jillson Street',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      postalCode: '90040',
      addressCountry: 'US',
    },
    openingHours: 'Mo-Su 08:00-18:00',
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2500',
      bestRating: '5',
    },
    sameAs: [
      'https://www.yelp.com/biz/sos-moving-los-angeles-4',
      'https://www.trustpilot.com/review/sosmovingla.net',
      'https://www.bbb.org/us/ca/los-angeles/profile/moving-services/sos-moving-llc-1216-1285189',
    ],
  };
}

export function generateBlogPostingLD(post: {
  title: string;
  metaDescription: string;
  featuredImage: string;
  publishDate: string;
  lastUpdated: string;
  author: { name: string };
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.featuredImage
      ? `https://www.sosmovingla.net${post.featuredImage}`
      : undefined,
    datePublished: post.publishDate,
    dateModified: post.lastUpdated || post.publishDate,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SOS Moving & Storage',
    },
    mainEntityOfPage: `https://www.sosmovingla.net/blog/${post.slug}`,
  };
}

export function generateFAQPageLD(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function generateBreadcrumbLD(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://www.sosmovingla.net${item.url}`,
    })),
  };
}
