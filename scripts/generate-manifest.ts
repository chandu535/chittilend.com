/**
 * Writes public/manifest.json, naming the installed app after the branch it was built
 * from.
 *
 *   npx tsx scripts/generate-manifest.ts
 *
 * `main` installs as SriPay and `dev` as ChittiLend, so the two can sit on the same home
 * screen without guessing which is which. They are already separate installs — a PWA's
 * identity is its origin, and the preview deployment is a different host from production
 * — so only the label needed solving, not the separation.
 *
 * Nothing inside the app changes: this is the name Android shows under the icon.
 *
 * The output is generated rather than committed, so the file always matches the branch
 * it was built from instead of whatever was last checked in. Both `dev` and `build` run
 * this first.
 */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const PRODUCTION_BRANCH = 'main';

function branch(): string {
  // Vercel does not run inside a git checkout, so it passes the ref through the
  // environment; locally, ask git.
  const fromVercel = process.env.VERCEL_GIT_COMMIT_REF;
  if (fromVercel) return fromVercel;
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return PRODUCTION_BRANCH;
  }
}

const current = branch();
const isProduction = current === PRODUCTION_BRANCH;

const name = isProduction ? 'SriPay' : 'ChittiLend';
const description = isProduction
  ? 'Manage borrowers, loans and collections for your chitti lending business.'
  : `Development build of SriPay, from the ${current} branch.`;

/**
 * Production shows the coin alone. A maskable icon must fill its canvas, and the launcher
 * crops that to a circle — which is where the violet ring around the coin came from. So
 * SriPay declares only `any` icons on transparency and the coin stands on its own.
 *
 * The dev build keeps the violet, which is now the quickest way to tell the two installed
 * apps apart on the same home screen.
 */
const icons = isProduction
  ? [
    { src: '/icon-coin-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-coin-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  ]
  : [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];

const manifest = {
  id: '/',
  name: isProduction ? 'SriPay — Chitti Lending Manager' : 'ChittiLend (dev)',
  short_name: name,
  description,
  lang: 'en',
  dir: 'ltr',
  start_url: '/dashboard',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'portrait',
  theme_color: '#7C3AED',
  background_color: '#F5F4FF',
  categories: ['finance', 'business', 'productivity'],
  icons,
};

writeFileSync('public/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `manifest.json -> "${manifest.short_name}" (branch ${current}${isProduction ? ', production' : ''})`
  + `, icons: ${isProduction ? 'coin on transparency' : 'coin on violet, maskable'}`,
);
