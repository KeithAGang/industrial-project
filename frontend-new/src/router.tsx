import { createRootRoute, createRoute, createRouter, redirect, Outlet } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './routes/LoginPage'
import { DashboardPage } from './routes/DashboardPage'
import { SolutionsPage } from './routes/SolutionsPage'
import { SolutionDetailPage } from './routes/SolutionDetailPage'
import { ClientsPage } from './routes/ClientsPage'
import { ChangeRequestsPage } from './routes/ChangeRequestsPage'
import { NotificationsPage } from './routes/NotificationsPage'
import { isAuthenticated } from './lib/auth'

const rootRoute = createRootRoute({ component: Outlet })

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: async () => {
    if (isAuthenticated()) throw redirect({ to: '/' })
  },
})

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AppLayout,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: '/login' })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/',
  component: DashboardPage,
})

const solutionsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/solutions',
  component: SolutionsPage,
})

const solutionDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/solutions/$id',
  component: SolutionDetailPage,
})

const clientsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/clients',
  component: ClientsPage,
})

const changeRequestsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/change-requests',
  component: ChangeRequestsPage,
})

const notificationsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/notifications',
  component: NotificationsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authLayoutRoute.addChildren([
    dashboardRoute,
    solutionsRoute,
    solutionDetailRoute,
    clientsRoute,
    changeRequestsRoute,
    notificationsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
