import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { QuoteForm } from '@/components/forms/QuoteForm';

type ServicesHeroProps = {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  showForm?: boolean;
};

export function ServicesHeroSection({
  title,
  subtitle,
  backgroundImage,
  showForm = true,
}: ServicesHeroProps) {
  return (
    <section className="relative pt-[3.5rem] pb-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black z-10" />
      {backgroundImage ? (
        <Image
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card-bg to-black" />
      )}

      <Container className="relative z-20 pt-12">
        {/* Rating badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-[0.6rem]">
            <span className="text-white font-bold text-[0.75rem]">4.89</span>
            <span className="text-text-muted">/5</span>
            <span className="text-white">1,585+ Reviews on</span>
            <span className="text-red-500 font-bold text-[0.7rem]">yelp</span>
          </div>
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-[0.6rem]">
            <span className="text-white font-bold text-[0.75rem]">4.98</span>
            <span className="text-text-muted">/5</span>
            <span className="text-white">1000+ Reviews on</span>
            <span className="text-white font-bold text-[0.7rem]">Google</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-[1.1] mb-3">
          {title}
        </h1>
        <p className="text-white/70 text-[0.8rem] max-w-lg mb-8">
          {subtitle}
        </p>

        {/* Quote Form */}
        {showForm && <QuoteForm />}
      </Container>
    </section>
  );
}
