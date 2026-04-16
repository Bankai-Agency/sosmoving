import type { Metadata } from 'next';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { CtaSection } from '@/components/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'SOS Moving and Storage photos and videos, including our employees, fleet of powerful trucks, and happy customers.',
};

const galleryImages = [
  '/images/general/645ab1d97922876aaf5bef8b_company-img-1.webp',
  '/images/general/645ab1d9792287bc985bef88_company-img-4.webp',
  '/images/general/645ab1d979228709eb5beffb_gallery-2.webp',
  '/images/general/645ab1d979228707af5bf000_video-4.webp',
];

export default function GalleryPage() {
  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Gallery
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            SOS Moving and Storage photos and videos, including our employees,
            fleet of powerful trucks, and happy customers.
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                <Image
                  src={img}
                  alt={`SOS Moving gallery photo ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
