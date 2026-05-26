import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { List } from '@phosphor-icons/react'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-h-screen overflow-auto lg:ml-[196px]">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center h-11 px-4 border-b border-border bg-card lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open navigation"
          >
            <List weight="bold" className="text-[17px]" />
          </button>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
