import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

/**
 * `?page=N` of a listing (/blog, /category/*). Page 1 lives at the bare
 * path, so `?page=1` is a 308 there; a value that is not a page number is a
 * 404 instead of a copy of page 1. Numbers past the last page are checked
 * by the caller, which knows the post count.
 */
export function resolvePage(raw: string | string[] | undefined, basePath: string): number {
  if (raw === undefined) return 1;
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) notFound();
  if (raw === '1') permanentRedirect(basePath);
  return Number(raw);
}

/** Pages 2+ are canonical to themselves and get "Page N" in title and description. */
export function paginatedMetadata(
  meta: Metadata,
  basePath: string,
  raw: string | string[] | undefined,
): Metadata {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || raw === '1') return meta;
  const url = `${basePath}?page=${raw}`;
  const suffix = ` — Page ${raw}`;
  const title =
    typeof meta.title === 'string'
      ? meta.title + suffix
      : meta.title && 'absolute' in meta.title && meta.title.absolute
        ? { absolute: meta.title.absolute + suffix }
        : meta.title;
  return {
    ...meta,
    title,
    description: meta.description ? `${meta.description} Page ${raw}.` : meta.description,
    alternates: { ...meta.alternates, canonical: url },
    ...(meta.openGraph ? { openGraph: { ...meta.openGraph, url } } : {}),
  };
}

/**
 * Pager in webflow.css vocabulary (no Tailwind in the (webflow) group):
 * .breadcrumbs is the site's flex row, .breadcrumbs-link the quiet link,
 * .w--current gets the accent color (global head styles).
 * prefetch is off: Googlebot rendering the page would otherwise fetch the
 * RSC payload of every visible link.
 */
export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showMax = 5;
  let start = Math.max(1, currentPage - Math.floor(showMax / 2));
  const end = Math.min(totalPages, start + showMax - 1);
  if (end - start + 1 < showMax) start = Math.max(1, end - showMax + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const href = (page: number) => (page === 1 ? basePath : `${basePath}?page=${page}`);

  return (
    <nav
      aria-label="Pagination"
      className="breadcrumbs"
      style={{ justifyContent: 'center', paddingTop: '2rem', paddingBottom: '1rem' }}
    >
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} prefetch={false} className="breadcrumbs-link">
          &larr; Prev
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={href(page)}
          prefetch={false}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`breadcrumbs-link${page === currentPage ? ' w--current' : ''}`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} prefetch={false} className="breadcrumbs-link">
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
