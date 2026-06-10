import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false)

  if (!content) return <>{children}</>

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 w-max max-w-xs pointer-events-none',
            'bg-popover text-popover-foreground border border-border rounded px-2 py-1',
            'text-[11px] leading-snug shadow-md',
            side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
            side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5',
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
