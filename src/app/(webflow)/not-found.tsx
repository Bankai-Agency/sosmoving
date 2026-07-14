import Link from 'next/link';

/**
 * Site-styled 404. Without this file Next.js renders its built-in
 * not-found page, which injects inline `background:#fff` styles — the
 * transparent navbar/footer became unreadable white-on-white.
 */
export default function NotFound() {
  return (
    <div className="services-hero-section is-blog-article-hero is-without-bg-image">
      <div className="container services-hero-container w-container">
        <div className="breadcrumbs">
          <Link href="/" className="breadcrumbs-link">Home</Link>
          <div className="text-size-14 weight-700 text-color">&gt;</div>
          <span aria-current="page" className="breadcrumbs-link w--current">404</span>
        </div>
        <h1 className="services-hero-h1 is-blog-article-h1">Page Not Found</h1>
        <div className="section-subtitle">
          <div>
            The page you are looking for doesn&rsquo;t exist or has been moved.
            Try the homepage or get a free moving quote.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingBottom: '4rem' }}>
          <Link href="/" className="button is-fill-button w-inline-block">
            <div>Back to Homepage</div>
          </Link>
          <Link href="/free-estimate" className="button is-fill-button w-inline-block">
            <div>Get My Free Quote</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
