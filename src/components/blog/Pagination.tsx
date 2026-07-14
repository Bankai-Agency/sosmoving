import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

/**
 * Pager in webflow.css vocabulary (no Tailwind in the (webflow) group):
 * .breadcrumbs is the site's flex row, .breadcrumbs-link the quiet link,
 * .w--current gets the accent color (global head styles).
 */
export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showMax = 5;
  let start = Math.max(1, currentPage - Math.floor(showMax / 2));
  const end = Math.min(totalPages, start + showMax - 1);
  if (end - start + 1 < showMax) start = Math.max(1, end - showMax + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      aria-label="Pagination"
      className="breadcrumbs"
      style={{ justifyContent: 'center', paddingTop: '2rem', paddingBottom: '1rem' }}
    >
      {currentPage > 1 && (
        <Link href={`${basePath}?page=${currentPage - 1}`} className="breadcrumbs-link">
          &larr; Prev
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`breadcrumbs-link${page === currentPage ? ' w--current' : ''}`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={`${basePath}?page=${currentPage + 1}`} className="breadcrumbs-link">
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
