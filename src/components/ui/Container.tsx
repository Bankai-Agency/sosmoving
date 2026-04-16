export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[940px] mx-auto px-4 ${className}`}>{children}</div>
  );
}
