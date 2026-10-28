// Renders public/og-image.png (1200x630) from scripts/og-image.html with headless Chrome.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
execFileSync(chrome, [
  '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630',
  '--virtual-time-budget=6000', `--screenshot=${resolve('public/og-image.png')}`,
  `file://${resolve('scripts/og-image.html')}`,
], { stdio: 'ignore' });
console.log('og-image written');
