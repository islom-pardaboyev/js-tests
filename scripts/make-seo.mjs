// Writes public/robots.txt and public/sitemap.xml for the site URL in VITE_SITE_URL (or SITE_URL).
import { readFileSync, writeFileSync } from 'node:fs';

function envFile() {
  try { return Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])); } catch { return {}; }
}
const site = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? envFile().VITE_SITE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const pages = ['/', '/verify', '/login', '/certificate/sample'];
const day = new Date().toISOString().slice(0, 10);

writeFileSync('public/robots.txt', `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /test/

Sitemap: ${site}/sitemap.xml
`);
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site}${p}</loc><lastmod>${day}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`robots.txt and sitemap.xml written for ${site}`);
