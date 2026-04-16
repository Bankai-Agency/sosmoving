import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { QuoteForm } from '@/components/forms/QuoteForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact SOS Moving & Storage. Call (909) 443-0004 or email info@sosmovingla.net. Office: 5530 Jillson Street, Los Angeles, CA 90040.',
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Contact Us
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            Get in touch with our team for a free quote or any questions about your move.
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Contact Info */}
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-white font-bold text-[0.9rem] mb-3">Phone</h3>
                <a href="tel:+19094430004" className="text-accent text-[1rem] font-bold hover:underline">
                  (909) 443-0004
                </a>
              </div>
              <div>
                <h3 className="text-white font-bold text-[0.9rem] mb-3">Email</h3>
                <a href="mailto:info@sosmovingla.net" className="text-accent text-[0.8rem] hover:underline">
                  info@sosmovingla.net
                </a>
              </div>
              <div>
                <h3 className="text-white font-bold text-[0.9rem] mb-3">Office Address</h3>
                <p className="text-[0.75rem]">5530 Jillson Street</p>
                <p className="text-[0.75rem]">Los Angeles, CA 90040</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-[0.9rem] mb-3">Hours</h3>
                <p className="text-[0.75rem]">Monday - Sunday, 8AM - 6PM</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-[0.9rem] mb-3">Licenses</h3>
                <div className="text-[0.7rem] space-y-1">
                  <p>USDOT: 3398018</p>
                  <p>CAL-T: 0192140</p>
                  <p>MC: 1153871</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1">
              <QuoteForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
