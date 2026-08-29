/**
 * Site-styled 404. Without this file Next.js renders its built-in
 * not-found page, which injects inline `background:#fff` styles — the
 * transparent navbar/footer became unreadable white-on-white.
 *
 * Markup is a 1:1 copy of the original Webflow 404 page
 * (sosmovingla.webflow.io/404), image assets self-hosted like the rest
 * of the clone. Rendered raw for exact parity, same as cloned pages.
 */

const ORIGINAL_404_HTML = `<div class="content-section"><div class="container w-container"><div class="bottom-cta-wrapper"><img src="/images/general/645ab1d9792287193e5bf051_404.webp" loading="lazy" width="556.5" sizes="(max-width: 479px) 92vw, (max-width: 767px) 417.75px, (max-width: 991px) 46vw, 40vw" alt="404-img" srcset="/images/general/645ab1d9792287193e5bf051_404-p-500.webp 500w, /images/general/645ab1d9792287193e5bf051_404-p-800.webp 800w, /images/general/645ab1d9792287193e5bf051_404.webp 1113w" class="_404-image"/><h2 class="section-h2 is-with-subtitle">Page not found</h2><div class="section-subtitle is-404">It looks like the page you were trying to access couldn&#x27;t be found. We apologize for the inconvenience.</div><a href="/" class="button is-fill-button is-big-button w-button">Back to&nbsp;homepage</a></div></div><div class="bottom-cta-background w-embed"><svg width="auto" height="100%" viewBox="0 0 1314 800" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g class="first-bubble" filter="url(#filter0_f_442_22800)">
		<ellipse cx="480.27" cy="399.741" rx="406" ry="244.07" transform="rotate(26.5357 480.27 399.741)" fill="url(#paint0_diamond_442_22800)" />
	</g>
	<g class="second-bubble" opacity="0.2" filter="url(#filter1_f_442_22800)">
		<ellipse cx="910.927" cy="440.758" rx="329.955" ry="198.355" transform="rotate(-30 910.927 440.758)" fill="url(#paint1_diamond_442_22800)" />
	</g>
	<defs>
		<filter id="filter0_f_442_22800" x="0.926025" y="15.8674" width="958.688" height="767.748" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
			<feFlood flood-opacity="0" result="BackgroundImageFix" />
			<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
			<feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_442_22800" />
		</filter>
		<filter id="filter1_f_442_22800" x="508.373" y="102.585" width="805.107" height="676.345" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
			<feFlood flood-opacity="0" result="BackgroundImageFix" />
			<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
			<feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_442_22800" />
		</filter>
		<radialGradient id="paint0_diamond_442_22800" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(499.418 157.086) rotate(93.0875) scale(318.055 790.597)">
			<stop stop-color="#4664FF" stop-opacity="0.54" />
			<stop offset="1" stop-color="#4664FF" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="paint1_diamond_442_22800" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(926.488 243.553) rotate(93.0875) scale(258.483 642.516)">
			<stop stop-color="#FFE533" />
			<stop offset="0.817708" stop-color="#363007" />
			<stop offset="1" stop-color="#FFE533" stop-opacity="0" />
		</radialGradient>
	</defs>
</svg></div></div>`;

export default function NotFound() {
  return <div dangerouslySetInnerHTML={{ __html: ORIGINAL_404_HTML }} />;
}
