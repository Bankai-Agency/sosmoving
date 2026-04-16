import { Container } from '@/components/ui/Container';
import { Accordion } from '@/components/ui/Accordion';
import type { FaqItem } from '@/lib/types';

export function FaqSection({ items, title = 'Frequently Asked Questions' }: { items: FaqItem[]; title?: string }) {
  if (!items.length) return null;

  return (
    <section className="py-16">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-8">{title}</h2>
        <div className="max-w-3xl">
          <Accordion items={items} />
        </div>
      </Container>
    </section>
  );
}
