/**
 * Every destination in the app, in one list.
 *
 * The sidebar renders all of it on tablet and desktop. The header menu renders whatever the
 * bottom bar has no room for, which is the only way those pages are reachable on a phone.
 * Holding the list here rather than in each component is what stops a page being added to
 * one nav and forgotten in the other — the header's set is *computed* from the bottom bar's,
 * so a new entry cannot be silently unreachable on mobile.
 */
import type { ReactNode } from 'react';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: ReactNode;
  /** Hidden from managers. The route's own `beforeLoad` is what actually enforces it. */
  adminOnly?: boolean;
}

const icon = (path: string) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export const NAV_ITEMS: NavItem[] = [
  {
    // First, because for a collector this is the whole app. The screen is designed for
    // someone who cannot read the rest of it, so it has to be the one they land on.
    to: '/collections',
    labelKey: 'nav.collections',
    icon: icon('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'),
  },
  {
    to: '/dashboard',
    labelKey: 'nav.home',
    icon: icon('M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'),
  },
  {
    to: '/loans',
    labelKey: 'nav.loans',
    icon: icon('M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z'),
  },
  {
    to: '/borrowers',
    labelKey: 'nav.borrowers',
    icon: icon('M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'),
  },
  {
    to: '/payments',
    labelKey: 'nav.payments',
    icon: icon('M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75'),
  },
  {
    to: '/analytics',
    labelKey: 'nav.analytics',
    icon: icon('M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'),
    adminOnly: true,
  },
  {
    to: '/capital',
    labelKey: 'nav.capital',
    icon: icon('M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z'),
  },
  {
    // Not admin-only. Everything in the export is already on the screens both roles can
    // read; the file is a convenience, not a wider view of the book.
    to: '/sheet',
    labelKey: 'nav.sheet',
    icon: icon('M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5M9 3.75v16.5m6-16.5v16.5M4.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15a.75.75 0 01.75-.75z'),
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: icon('M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z'),
    adminOnly: true,
  },
  {
    // Last, because it is not a daily destination.
    to: '/bin',
    labelKey: 'nav.bin',
    icon: icon('M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'),
    adminOnly: true,
  },
];

/**
 * Issuing a loan, which is the raised button in the middle of the phone's bottom bar.
 *
 * Kept out of NAV_ITEMS because it is an action rather than a destination: the sidebar
 * lists places to go, and this is a form to start.
 */
export const NEW_LOAN_ITEM: NavItem = {
  to: '/loans/new',
  labelKey: 'nav.newLoan',
  icon: icon('M12 4.5v15m7.5-7.5h-15'),
};

/**
 * What the phone's bottom bar covers, in the order it shows them. Five slots, and the
 * middle one is the new-loan button rather than a page.
 *
 * Collections holds the fifth slot: a collector opens the app to record money, and that is
 * the screen they open it for. Borrowers has the fourth, and Payments moved to the profile
 * menu to make room — the day book covers taking money at the door, so the payments list is
 * something the owner reviews rather than something anyone reaches for on a doorstep.
 *
 * Nothing is lost by moving a page out of here. OVERFLOW_ITEMS is derived from whatever the
 * bar does not carry, so one edit to this array moves a page between the bar and the menu.
 */
export const BOTTOM_NAV_PATHS = ['/dashboard', '/loans', '/loans/new', '/borrowers', '/collections'];

/**
 * The bar's own items, resolved from the paths above.
 *
 * This is the part that was missing, and its absence caused exactly the bug this file's
 * header warns about. BottomNav carried a second hardcoded list of five destinations, so
 * changing BOTTOM_NAV_PATHS moved a page *out* of the overflow menu without moving it
 * *into* the bar — leaving the new page unreachable on a phone and the old one shown twice.
 *
 * With the bar rendered from here, the paths above are the single fact: one edit moves a
 * page between the bar and the menu, and the two can no longer disagree.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_PATHS
  .map((path) => (path === NEW_LOAN_ITEM.to ? NEW_LOAN_ITEM : NAV_ITEMS.find((item) => item.to === path)))
  .filter((item): item is NavItem => item !== undefined);

/**
 * The pages a phone has nowhere else to reach — Analytics, Capital, Sheet, Settings, Bin.
 * Derived rather than listed, so adding a destination above puts it in the header menu
 * automatically instead of stranding it on mobile until somebody notices.
 */
export const OVERFLOW_ITEMS = NAV_ITEMS.filter((item) => !BOTTOM_NAV_PATHS.includes(item.to));

export function visibleTo(items: NavItem[], role: string | undefined): NavItem[] {
  return items.filter((item) => !item.adminOnly || role === 'admin');
}
