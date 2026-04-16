import Image from 'next/image';
import { Container } from '@/components/ui/Container';

const reasons = [
  {
    title: 'Licensed and insured',
    description:
      'Apart from having highly skilled experts, we are licensed and insured to operate, ensuring the highest safety standards for your belongings.',
    image: '/images/general/why-img-1.webp',
  },
  {
    title: '5-star reviews',
    description:
      'Hundreds of outstanding reviews across Google, Yelp, and other platforms confirm the quality of our service and commitment to excellence.',
    image: '/images/general/why-img-2.webp',
  },
  {
    title: 'Quality supplies',
    description:
      'We use premium blankets, unlimited shrink wrap, and professional equipment. Our strict quality control ensures nothing gets damaged.',
    image: '/images/general/why-img-3.webp',
  },
  {
    title: 'Customer service',
    description:
      'Our team is available 7 days a week to help plan your move. We treat every customer like family and go above and beyond expectations.',
    image: '/images/general/why-img-4.webp',
  },
];

export function WhySosSection() {
  return (
    <section className="py-16">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-10">Why SOS Moving?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden aspect-[3/2]"
            >
              {/* Background image */}
              <Image
                src={reason.image}
                alt={reason.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white font-bold text-[1rem] mb-2">
                  {reason.title}
                </h3>
                <p className="text-white/70 text-[0.7rem] leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
