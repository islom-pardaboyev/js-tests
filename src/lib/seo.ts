import { useEffect } from 'react';

const SITE_NAME = 'JSTests';
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? window.location.origin).replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/og-image.png`;

interface PageMeta {
  /** Short page title. The site name is appended. */
  title: string;
  description: string;
  /** Path used for the canonical URL, e.g. "/verify". */
  path?: string;
  /** Private pages (dashboard, exam, admin, certificates) are kept out of search. */
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function fullTitle(title: string): string {
  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

/** Applies the document title, description, canonical, Open Graph and Twitter tags for the current page. */
export function usePageMeta({ title, description, path, noindex = false }: PageMeta): void {
  useEffect(() => {
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const full = fullTitle(title);
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', OG_IMAGE);
  }, [title, description, path, noindex]);
}
