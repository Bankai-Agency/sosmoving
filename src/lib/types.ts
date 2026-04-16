// ===== City Pages =====
export interface CityData {
  slug: string;
  parentSlug: string | null;
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  phone: string;
  sections: CitySection[];
  sectionOrder: string[];
  faq: FaqItem[];
}

export interface CitySection {
  type: string;
  title: string;
  content: string;
  image?: string;
  imagePosition?: 'left' | 'right';
}

// ===== Service Pages =====
export interface ServiceData {
  slug: string;
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  phone: string;
  sections: ServiceSection[];
  sectionOrder: string[];
  faq: FaqItem[];
}

export interface ServiceSection {
  type: string;
  title: string;
  content: string;
  image?: string;
}

// ===== Blog =====
export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  featuredImage: string;
  author: Author;
  publishDate: string;
  lastUpdated: string;
  category: string;
  readTime: string;
  content: string;
}

export interface BlogPostCard {
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  publishDate: string;
  readTime: string;
  category: string;
}

export interface Author {
  name: string;
  role: string;
  photo: string;
  bio?: string;
}

// ===== Shared =====
export interface FaqItem {
  question: string;
  answer: string;
}

export interface Review {
  name: string;
  text: string;
  rating: number;
  platform: 'google' | 'yelp' | 'trustpilot' | 'homeadvisor';
  date?: string;
}

export interface VideoReview {
  name: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio?: string;
}

export interface CompanyInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hours: string;
  licenses: {
    usdot: string;
    calT: string;
    mc: string;
  };
  social: {
    yelp: string;
    google: string;
    youtube: string;
    trustpilot: string;
    bbb: string;
  };
  ratings: {
    google: { score: number; count: number };
    yelp: { score: number; count: number };
    trustpilot: { score: number; count: number };
    homeadvisor: { score: number; count: number };
  };
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// ===== Page Section Registry =====
export type SectionKey =
  | 'hero'
  | 'services-hero'
  | 'about-company'
  | 'reviews'
  | 'video-reviews'
  | 'why-sos'
  | 'services-grid'
  | 'locations-slider'
  | 'service-areas'
  | 'service-content'
  | 'faq'
  | 'latest-news'
  | 'cta'
  | 'milestones'
  | 'gallery'
  | 'steps'
  | 'advantages';
