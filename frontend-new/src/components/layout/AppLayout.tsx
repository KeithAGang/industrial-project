import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
