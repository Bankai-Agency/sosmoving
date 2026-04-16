import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

type HeroProps = {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  showRatings?: boolean;
  showStats?: boolean;
  phone?: string;
};

export function HeroSection({
  title,
  subtitle,
  backgroundImage,
  showRatings = true,
  showStats = true,
  phone = '(909) 443-0004',
}: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-[3.5rem]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
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

      <Container className="relative z-20 pb-16">
        {/* Rating badges */}
        {showRatings && (
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-white font-bold text-[0.85rem]">4.89</span>
              <span className="text-[0.6rem] text-text-muted">/5</span>
              <span className="text-[0.65rem] text-white">1,600+ Reviews on</span>
              <span className="text-red-500 font-bold text-[0.8rem]">yelp</span>
            </div>
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-white font-bold text-[0.85rem]">4.98</span>
              <span className="text-[0.6rem] text-text-muted">/5</span>
              <span className="text-[0.65rem] text-white">1,000+ Reviews on</span>
              <span className="text-white font-bold text-[0.8rem]">Google</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-white text-[2.2rem] md:text-[3.2rem] font-black leading-[1.1] mb-4">
          {title}
        </h1>
        <p className="text-white/80 text-[0.85rem] max-w-lg mb-8 leading-relaxed">
          {subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <Button href="/free-estimate">Get a Free Quote</Button>
          <Button href={`tel:+19094430004`} variant="outline" external>
            Call {phone}
          </Button>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="flex gap-8 mt-12 border-t border-white/10 pt-6">
            <div>
              <div className="text-white text-[1.6rem] font-black">10,000+</div>
              <div className="text-[0.6rem] text-text-muted">Successful Moves</div>
            </div>
            <div className="border-l border-white/10 pl-8">
              <div className="text-white text-[1.6rem] font-black">2019</div>
              <div className="text-[0.6rem] text-text-muted">Trusted Since</div>
            </div>
            <div className="border-l border-white/10 pl-8">
              <div className="text-white text-[1.6rem] font-black">20+</div>
              <div className="text-[0.6rem] text-text-muted">Serving Cities</div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
