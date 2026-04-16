import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Accordion } from '@/components/ui/Accordion';
import { CtaSection } from '@/components/sections/CtaSection';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about SOS Moving & Storage services, pricing, and policies.',
};

const faqItems = [
  { question: 'How much do movers cost in Los Angeles?', answer: 'Our rates start at $119 per hour for a team of two movers and a truck. The final cost depends on the size of your move, distance, and any additional services requested. We provide free, no-obligation estimates so you know exactly what to expect.' },
  { question: 'What is included in the moving service?', answer: 'Every move includes premium blankets, unlimited shrink wrap, wardrobe boxes, furniture disassembly and reassembly, and TV unmounting — all at no extra cost. We also provide a fully equipped truck and a professional moving crew.' },
  { question: 'Do you offer same-day moving services?', answer: 'Yes, we offer same-day moving services based on availability. We recommend booking in advance to ensure we can accommodate your preferred date and time, but we do our best to help with last-minute moves.' },
  { question: 'What areas do you serve?', answer: 'We serve the entire Greater Los Angeles area, Orange County, Inland Empire, and beyond. We also provide long-distance moving services to Portland, Seattle, Denver, and other cities across the United States.' },
  { question: 'How do I get a free estimate?', answer: 'You can get a free estimate by filling out the form on our website, calling us at (909) 443-0004, or emailing info@sosmovingla.net. We will ask about your move details and provide a transparent, all-inclusive quote.' },
  { question: 'Are you licensed and insured?', answer: 'Yes, SOS Moving is fully licensed and insured. Our USDOT number is 3398018, California license is CAL-T0192140, and MC number is 1153871. We carry comprehensive liability insurance to protect your belongings.' },
  { question: 'How far in advance should I book?', answer: 'We recommend booking at least 1-2 weeks in advance, especially during peak moving season (May through September). However, we often accommodate moves with shorter notice depending on availability.' },
  { question: 'Do you provide packing materials?', answer: 'Yes, we provide all necessary packing materials including boxes, tape, bubble wrap, and packing paper. Our packing services range from partial packing (fragile items only) to full-service packing of your entire home.' },
];

export default function FAQPage() {
  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            Everything you need to know about our moving services.
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="max-w-3xl">
            <Accordion items={faqItems} />
          </div>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
