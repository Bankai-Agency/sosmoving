import Link from 'next/link';

type ButtonProps = {
  href?: string;
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  className?: string;
  external?: boolean;
};

export function Button({
  href,
  variant = 'primary',
  children,
  className = '',
  external,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-bold text-[0.8rem] px-8 py-3 rounded-full transition-colors';
  const variants = {
    primary: 'bg-accent text-black hover:bg-accent-hover',
    outline:
      'border border-white/20 text-white hover:border-accent hover:text-accent',
  };

  const cls = `${base} ${variants[variant]} ${className}`;

  if (href && !external) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  if (href && external) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }

  return <button className={cls}>{children}</button>;
}
