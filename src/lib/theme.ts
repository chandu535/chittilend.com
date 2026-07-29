import { Store } from '@tanstack/store';

/**
 * Light, dark, and the device's own setting.
 *
 * Three states rather than a boolean, because "follow the phone" is a real preference and
 * not the absence of one. A user who has never touched this should track their device as it
 * moves between day and night; collapsing that into a stored `light` the first time the app
 * loads would freeze them wherever they happened to start.
 */
export type ThemeChoice = 'light' | 'dark' | 'system';

/** What `system` currently resolves to. Only ever `light` or `dark`. */
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'chittilend-theme';

export const themeStore = new Store({
  choice: 'system' as ThemeChoice,
  resolved: 'light' as ResolvedTheme,
});

const query = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export function systemTheme(): ResolvedTheme {
  return query()?.matches ? 'dark' : 'light';
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === 'system' ? systemTheme() : choice;
}

/**
 * The single place the class is written.
 *
 * `.dark` on the root element is what every token in styles.css keys off, and the
 * theme-color meta is updated alongside it so the phone's status bar and the PWA's own
 * chrome match the page instead of staying whatever the light theme asked for.
 */
export function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', resolved === 'dark');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#100418' : '#2c0047');
}

export function setTheme(choice: ThemeChoice) {
  const resolved = resolveTheme(choice);
  themeStore.setState(() => ({ choice, resolved }));
  applyTheme(resolved);

  if (typeof window === 'undefined') return;
  // `system` is stored as the absence of a preference, so a device that has never been told
  // otherwise keeps following itself even after the key is written and cleared again.
  if (choice === 'system') localStorage.removeItem(THEME_KEY);
  else localStorage.setItem(THEME_KEY, choice);
}

/**
 * Reads the stored choice into the store after hydration, and keeps following the device
 * for as long as the choice is `system`.
 *
 * Returns a teardown for the media-query listener. The class itself was already put on the
 * element by the inline script in the document head — this only catches the store up, so
 * nothing here can cause a flash.
 */
export function initTheme(): () => void {
  if (typeof window === 'undefined') return () => {};

  const stored = localStorage.getItem(THEME_KEY);
  const choice: ThemeChoice = stored === 'light' || stored === 'dark' ? stored : 'system';
  themeStore.setState(() => ({ choice, resolved: resolveTheme(choice) }));

  const mq = query();
  if (!mq) return () => {};

  const onChange = () => {
    if (themeStore.state.choice !== 'system') return;
    const resolved = systemTheme();
    themeStore.setState((s) => ({ ...s, resolved }));
    applyTheme(resolved);
  };

  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Runs before the first paint, inlined into the document head.
 *
 * The server cannot know which theme this device wants — localStorage and the media query
 * both live in the browser — so markup always arrives light. Without this the first frame
 * is a white page, which on a phone at night is the difference between an app and a torch.
 *
 * Deliberately tiny, dependency-free and wrapped in try/catch: it blocks the first paint,
 * and a device with storage disabled must fall through to the light theme rather than
 * leaving the page blank.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_KEY}');var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#100418');}}catch(e){}})();`;
