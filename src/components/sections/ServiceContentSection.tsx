import Image from 'next/image';
import { Container } from '@/components/ui/Container';

type ServiceContentProps = {
  title: string;
  content: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  variant?: 'dark' | 'light';
};

export function ServiceContentSection({
  title,
  content,
  image,
  imagePosition = 'right',
  variant = 'dark',
}: ServiceContentProps) {
  const bg = variant === 'light' ? 'bg-white' : '';
  const textColor = variant === 'light' ? 'text-dim-grey' : '';
  const titleColor = variant === 'light' ? 'text-black' : 'text-white';

  return (
    <section className={`py-16 ${bg}`}>
      <Container>
        <div
          className={`flex flex-col ${
            imagePosition === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'
          } gap-10 items-center`}
        >
          {/* Text */}
          <div className="flex-1">
            {title && (
              <h2 className={`text-[1.5rem] font-bold mb-4 ${titleColor}`}>
                {title}
              </h2>
            )}
            <div
              className={`text-[0.75rem] leading-relaxed ${textColor} space-y-3`}
            >
              {content.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Image */}
          {image && (
            <div className="flex-1 w-full">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
