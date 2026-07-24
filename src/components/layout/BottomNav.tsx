import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, useMatchRoute } from '@tanstack/react-router';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const LoansIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const NewIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const PaymentsIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const navItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.home', icon: <HomeIcon /> },
  { to: '/loans', labelKey: 'nav.loans', icon: <LoansIcon /> },
  { to: '/loans/new', labelKey: 'nav.newLoan', icon: <NewIcon /> },
  { to: '/payments', labelKey: 'nav.payments', icon: <PaymentsIcon /> },
  { to: '/borrowers', labelKey: 'nav.borrowers', icon: <ProfileIcon /> },
];

export function BottomNav() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: true });
          const isNew = item.to === '/loans/new';

          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'text-xs transition-colors min-w-0',
                isNew
                  ? 'text-white'
                  : isActive
                    ? 'text-primary'
                    : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {isNew ? (
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white -mt-4 shadow-lg">
                  {item.icon}
                </div>
              ) : (
                item.icon
              )}
              <span className={clsx(
                'truncate max-w-full px-1 nav-label',
                isNew && 'text-primary',
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
