import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showMax = 5;
  let start = Math.max(1, currentPage - Math.floor(showMax / 2));
  const end = Math.min(totalPages, start + showMax - 1);
  if (end - start + 1 < showMax) start = Math.max(1, end - showMax + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2 mt-10">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-3 py-2 text-[0.7rem] text-white border border-white/10 rounded-lg hover:border-accent hover:text-accent transition-colors"
        >
          &larr; Prev
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={`w-9 h-9 flex items-center justify-center text-[0.7rem] rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-accent text-black font-bold'
              : 'text-white border border-white/10 hover:border-accent hover:text-accent'
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-3 py-2 text-[0.7rem] text-white border border-white/10 rounded-lg hover:border-accent hover:text-accent transition-colors"
        >
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
