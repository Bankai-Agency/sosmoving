import Image from 'next/image';
import { Container } from '@/components/ui/Container';

export function AboutCompanySection() {
  return (
    <section className="py-16">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-8">
          Professional Moving Services in Los Angeles
        </h2>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Text content */}
          <div className="flex-1">
            <p className="text-[0.8rem] leading-relaxed mb-4">
              SOS Moving is a licensed and insured moving company in Los Angeles
              serving residential and commercial clients across Southern
              California and beyond. Since our founding, we have completed
              thousands of successful relocations — from studio apartments in
              Downtown LA to five-bedroom homes in Calabasas, from small office
              suites to full corporate headquarters.
            </p>
            <p className="text-[0.8rem] leading-relaxed mb-6">
              Every move includes premium blankets, unlimited shrink wrap,
              wardrobe boxes, furniture disassembly and reassembly, and TV
              unmounting at no extra cost.
            </p>

            {/* Included services */}
            <div className="grid grid-cols-2 gap-3">
              {[
                'Premium blankets',
                'Unlimited shrink wrap',
                'Wardrobe boxes',
                'Furniture disassembly',
                'TV unmounting',
                'No hidden fees',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-[0.7rem] text-white/80"
                >
                  <svg
                    className="w-4 h-4 text-accent flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <Image
                src="/images/general/645ab1d97922876aaf5bef8b_company-img-1.webp"
                alt="SOS Moving team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-8">
              <Image
                src="/images/general/645ab1d9792287bc985bef88_company-img-4.webp"
                alt="SOS Moving truck"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
