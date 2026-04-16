import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

const services = [
  {
    title: 'Apartment Movers',
    href: '/services/apartment-movers',
    image: '/images/services/645ab1d979228786a75bf0d9_Apartment-Movers.webp',
    icon: '/images/general/645ab1d9792287f34c5bf050_house.svg',
  },
  {
    title: 'Commercial Movers',
    href: '/services/commercial-movers',
    image: '/images/services/645ab1d97922877a145befa6_services-img-4.webp',
    icon: '/images/general/645ab1d979228711d65bf041_chair.svg',
  },
  {
    title: 'Long-Distance Movers',
    href: '/services/long-distance-movers',
    image: '/images/services/645ab1d9792287ddda5befc2_services-img-2.webp',
    icon: '/images/general/645ab1d9792287ce4c5bf057_gift.svg',
  },
  {
    title: 'Packing Services',
    href: '/services/packing-services',
    image: '/images/services/645ab1d979228713705befa4_services-img-5.webp',
    icon: '/images/general/645ab1d979228711d65bf041_chair.svg',
  },
  {
    title: 'White Glove Movers',
    href: '/services/white-glove-movers',
    image: '/images/services/645ab1d979228797c85befa3_services-img-6.webp',
    icon: '/images/general/645ab1d9792287ce4c5bf057_gift.svg',
  },
  {
    title: 'Storage',
    href: '/services/storage',
    image: '/images/services/645ab1d97922871b155befa5_services-img-3.webp',
    icon: '/images/general/645ab1d9792287f34c5bf050_house.svg',
  },
];

export function ServicesGridSection() {
  return (
    <section className="py-16 bg-surface">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-2">SOS Moving Services</h2>
        <p className="text-[0.8rem] mb-8 max-w-2xl">
          We offer a wide range of services, providing all the required
          resources to deliver an outstanding moving experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group block bg-card-bg rounded-xl overflow-hidden hover:bg-card-bg-hover transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4 flex items-center gap-3">
                <Image
                  src={service.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="opacity-60"
                />
                <h3 className="text-white text-[0.8rem] font-bold group-hover:text-accent transition-colors">
                  {service.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
