import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { uiStore, setLanguage, LANG_COOKIE } from '@/lib/stores';
import { ToastContainer } from '@/components/ui/Toast';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import '@/lib/i18n/config';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#7C3AED' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'description', content: 'SriPay — Manage chitti lending operations' },
      { title: 'SriPay' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', href: '/icon-coin-192.png', type: 'image/png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon-coin.png' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { i18n } = useTranslation();

  // Sync language preference from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem(LANG_COOKIE);
    if (saved === 'te' || saved === 'en') {
      setLanguage(saved);
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  return (
    <RootDocument>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <ToastContainer />
      <InstallPrompt />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const language = useStore(uiStore, (s) => s.language);

  return (
    // suppressHydrationWarning only applies one level deep, so head and body need their
    // own. Browser extensions (Grammarly, the devtools locator) inject attributes here
    // before React hydrates, which React would otherwise report as a mismatch.
    <html lang={language} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
