'use client';

import { Container } from '@/components/ui/Container';
import type { Review } from '@/lib/types';

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="py-16">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-2">
          SOS Moving Company Reviews
        </h2>

        {/* Platform ratings */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { name: 'Google', score: '4.9', count: '1,007', color: 'text-white' },
            { name: 'Yelp', score: '4.8', count: '1,585', color: 'text-red-500' },
            { name: 'Trustpilot', score: '4.4', count: '56', color: 'text-green-500' },
            { name: 'BBB', score: 'A', count: '', color: 'text-blue-500' },
          ].map((platform) => (
            <div
              key={platform.name}
              className="bg-card-bg rounded-lg px-5 py-3 flex items-center gap-3"
            >
              <div>
                <span className={`font-black text-[1.2rem] ${platform.color}`}>
                  {platform.score}
                </span>
                <span className="text-text-muted text-[0.6rem]">/5</span>
              </div>
              <div className="text-[0.6rem]">
                <div className="text-accent">{'★'.repeat(5)}</div>
                <div className="text-text-muted">
                  {platform.count && `${platform.count} reviews`}
                </div>
              </div>
              <span className="text-white font-bold text-[0.7rem]">
                {platform.name}
              </span>
            </div>
          ))}
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.slice(0, 6).map((review, i) => (
            <div key={i} className="bg-card-bg rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-[0.6rem]">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-white font-bold text-[0.7rem]">
                    {review.name}
                  </div>
                  <div className="text-accent text-[0.6rem]">
                    {'★'.repeat(review.rating)}
                  </div>
                </div>
              </div>
              <p className="text-[0.7rem] leading-relaxed line-clamp-6">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
