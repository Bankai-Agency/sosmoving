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
 * Which page numbers a pager shows: the first and the last page, the two
 * neighbours on each side of the current one, and a milestone every
 * `step` pages (5, 10, 15 ... for a 35-page blog), with "gap" between
 * non-adjacent numbers. The milestones are what make the whole listing
 * crawlable: with a plain five-page window the last pages of /blog sat
 * 16 clicks deep and Search Console listed 180+ posts as discovered but
 * never crawled; with milestones every page is at most three clicks from
 * /blog. Pure and exported so the depth can be checked without a browser.
 */
export function pageItems(currentPage: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const step = totalPages <= 20 ? 5 : totalPages <= 60 ? 5 : 10;
  const set = new Set<number>([1, totalPages]);
  for (let p = currentPage - 2; p <= currentPage + 2; p++) if (p >= 1 && p <= totalPages) set.add(p);
  for (let p = step; p < totalPages; p += step) set.add(p);
  const sorted = [...set].sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('gap');
    items.push(p);
  });
  return items;
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

  const href = (page: number) => (page === 1 ? basePath : `${basePath}?page=${page}`);

  return (
    <nav
      aria-label="Pagination"
      className="breadcrumbs"
      style={{ justifyContent: 'center', flexWrap: 'wrap', rowGap: '0.6rem', paddingTop: '2rem', paddingBottom: '1rem' }}
    >
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} prefetch={false} rel="prev" className="breadcrumbs-link">
          &larr; Prev
        </Link>
      )}
      {pageItems(currentPage, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="breadcrumbs-link">
            &hellip;
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            prefetch={false}
            aria-current={item === currentPage ? 'page' : undefined}
            aria-label={`Page ${item}`}
            className={`breadcrumbs-link${item === currentPage ? ' w--current' : ''}`}
          >
            {item}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} prefetch={false} rel="next" className="breadcrumbs-link">
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
