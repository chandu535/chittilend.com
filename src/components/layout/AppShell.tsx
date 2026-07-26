import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { APP_SCROLL_ID } from '@/lib/constants';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    // Fixed to one viewport at every size, so the page itself never scrolls. Each page
    // owns its own scrolling region — see ScrollPage and ListPage.
    // dvh rather than vh so mobile browser chrome is accounted for.
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        {/* min-w-0 is load-bearing: as a flex child it defaults to min-width:auto, so a
            wide descendant would stretch it and scroll the whole app sideways. */}
        <main
          id={APP_SCROLL_ID}
          data-scroll-restoration-id={APP_SCROLL_ID}
          className="min-h-0 min-w-0 flex-1 overflow-hidden pb-16 md:pb-0"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
