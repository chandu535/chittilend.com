import { Store } from '@tanstack/store';

// Auth state
export const authStore = new Store({
  user: null as { id: string; name: string; role: 'admin' | 'manager' } | null,
  isAuthenticated: false,
});

// UI preferences
export const uiStore = new Store({
  language: 'en' as 'en' | 'te',
  useNativeNumerals: false,
  sidebarOpen: false,
  activeFilters: {
    loanStatus: 'all' as string,
    dateRange: 'thisMonth' as string,
    area: 'all' as string,
  },
});

export const LANG_COOKIE = 'chittilend-lang';

export function setLanguage(lang: 'en' | 'te') {
  uiStore.setState((s) => ({ ...s, language: lang }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_COOKIE, lang);
    document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    document.documentElement.setAttribute('lang', lang);
  }
}

export function setNativeNumerals(useNative: boolean) {
  uiStore.setState((s) => ({ ...s, useNativeNumerals: useNative }));
}

export function toggleSidebar() {
  uiStore.setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen }));
}

export function setAuthUser(user: { id: string; name: string; role: 'admin' | 'manager' } | null) {
  authStore.setState(() => ({
    user,
    isAuthenticated: user !== null,
  }));
}
