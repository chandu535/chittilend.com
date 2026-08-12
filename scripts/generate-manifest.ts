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
 * One icon set for both branches, in two frames.
 *
 * These used to differ per branch: production shipped the coin alone on transparency
 * because a maskable icon must fill its canvas and the launcher cropped that to a circle,
 * which is where the violet ring around the coin came from. That is solved properly now,
 * so both builds can look the same and telling the installs apart goes back to being the
 * name's job — `main` installs as SriPay, `dev` as ChittiLend.
 *
 * The two purposes carry different artwork on purpose, because the shape of the hole they
 * are poured into is not the same:
 *
 *   any       the square mark, gold border and all. Used where nothing crops it — the
 *             browser tab, a desktop install, iOS via apple-touch-icon.
 *
 *   maskable  the round mark on a solid brand field. Android hands the shape to the
 *             launcher, and many phones cut every icon to a circle, which turned the
 *             square version into an icon inside an icon. The disc is drawn at exactly
 *             72/108 of the canvas — the fraction an adaptive icon's circle mask leaves
 *             visible — so the gold ring lands on the crop edge with no dark margin
 *             inside it and no ring sliced off.
 *
 * A launcher using a squircle instead shows the same disc with a little brand field
 * around it, which is what that shape is for.
 */
const icons = [
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
  theme_color: '#2c0047',
  background_color: '#f7f4f9',
  categories: ['finance', 'business', 'productivity'],
  icons,
};

writeFileSync('public/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `manifest.json -> "${manifest.short_name}" (branch ${current}${isProduction ? ', production' : ''})`
  + ', icons: SP mark, any + maskable',
);
