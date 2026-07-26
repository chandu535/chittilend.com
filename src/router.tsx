import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { APP_SCROLL_ID } from './lib/constants'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    // From md up the shell scrolls <main>, not the window, so the router has to be
    // told to reset that element on navigation.
    scrollToTopSelectors: [`#${APP_SCROLL_ID}`],
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
