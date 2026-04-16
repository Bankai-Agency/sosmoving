import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { QuoteForm } from '@/components/forms/QuoteForm';

export const metadata: Metadata = {
  title: 'Free Estimate',
  description: 'Get a free, no-obligation moving estimate from SOS Moving & Storage. Fill out the form or call (909) 443-0004.',
};

export default function FreeEstimatePage() {
  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Get a Free Estimate
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            Fill out the form below and we&apos;ll get back to you with a detailed, no-obligation quote for your move.
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="max-w-[600px] mx-auto">
            <QuoteForm />
          </div>

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: 'No Hidden Fees', desc: 'Transparent pricing with everything included in your quote.' },
              { title: 'Quick Response', desc: 'We respond to all estimate requests within 1 hour during business hours.' },
              { title: 'Best Price Guarantee', desc: 'Starting from $119/hr with premium service and supplies included.' },
            ].map((b) => (
              <div key={b.title} className="text-center">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-[0.8rem] mb-1">{b.title}</h3>
                <p className="text-[0.65rem]">{b.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
