import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import '@/lib/i18n/config';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ChittiLend' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <ToastContainer />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const language = useStore(uiStore, (s) => s.language);

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
