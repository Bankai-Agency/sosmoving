import { readFileSync } from 'fs';
import { join } from 'path';

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
}: {
  name: 'navbar' | 'footer' | 'exit-popup';
  footerAreas?: boolean;
}) {
  let html = read(name);
  if (!html) return null;
  if (name === 'footer') html = html.replace('<!--footer-areas-->', footerAreas ? read('footer-areas') : '');
  return <div data-shared-block={name} dangerouslySetInnerHTML={{ __html: html }} />;
}
