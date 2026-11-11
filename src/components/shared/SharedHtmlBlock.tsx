import { readFileSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';

const SHARED_DIR = join(process.cwd(), 'src/data/shared');

// Read once at build time. In dev, this will re-read on HMR since it's in a Server Component.
function read(name: string): string {
  try {
    return readFileSync(join(SHARED_DIR, `${name}.html`), 'utf-8');
  } catch {
    return '';
  }
}

/**
 * The ad landing copies (/ads/*) keep only the logo, the phone and the quote
 * button in the header: the menu with its dropdowns and Login, the social
 * icons, the mobile burger and the sticky call-back tab are cut out of the
 * markup, not hidden - nothing to click through and nothing for the scripts
 * to wire (sos-native.js skips the navbar module when there is no burger).
 */
const ADS_NAVBAR_REMOVE = '.navbar-dropdowns, .navbar-socials-box, .navbar-menu-button, .callback-widget';

function adsNavbar(html: string): string {
  const $ = cheerio.load(html, null, false);
  $(ADS_NAVBAR_REMOVE).remove();
  return $.html();
}

/**
 * Renders a shared HTML block from src/data/shared/{name}.html
 * Server Component — reads file at build time, renders via dangerouslySetInnerHTML.
 * The HTML is from Webflow and includes absolute paths + className hooks that
 * webflow.css and ScriptLoader/IX2 depend on.
 *
 * The footer's <!--footer-areas--> placeholder takes the links to every city
 * page (footer-areas.html). The ad landing copies render the footer without
 * them: the copies stay out of the site graph, so no links go there at all -
 * not even hidden ones.
 */
export function SharedHtmlBlock({
  name,
  footerAreas = true,
  variant = 'site',
}: {
  name: 'navbar' | 'footer' | 'exit-popup';
  footerAreas?: boolean;
  /** "ads": the stripped-down header of the ad landing copies. */
  variant?: 'site' | 'ads';
}) {
  let html = read(name);
  if (!html) return null;
  if (name === 'footer') html = html.replace('<!--footer-areas-->', footerAreas ? read('footer-areas') : '');
  if (name === 'navbar' && variant === 'ads') html = adsNavbar(html);
  return <div data-shared-block={name} dangerouslySetInnerHTML={{ __html: html }} />;
}
