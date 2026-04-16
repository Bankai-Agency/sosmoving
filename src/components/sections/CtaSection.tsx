import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function CtaSection() {
  return (
    <section className="py-16 bg-surface">
      <Container className="text-center">
        <h2 className="text-[1.75rem] font-bold mb-4">
          Ready to Move? Get Your Free Quote
        </h2>
        <p className="text-[0.8rem] mb-8 max-w-lg mx-auto">
          Contact us today for a free, no-obligation estimate. Our team is ready
          to help make your move smooth and stress-free.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/free-estimate">Get a Free Quote</Button>
          <Button href="tel:+19094430004" variant="outline" external>
            Call (909) 443-0004
          </Button>
        </div>
      </Container>
    </section>
  );
}
