'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-400',
        className
      )}
      aria-label="QR-Star logo"
      title="QR-Star"
    >
      <Star className="h-5 w-5 text-white drop-shadow" />
    </div>
  )
}

export function BrandTitle({
  withMark = true,
  size = 'md',
  subtitle,
  className,
}: {
  withMark?: boolean
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
  className?: string
}) {
  const titleClass =
    size === 'lg'
      ? 'text-2xl md:text-3xl font-bold'
      : size === 'sm'
      ? 'text-lg font-semibold'
      : 'text-xl md:text-2xl font-semibold'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {withMark ? <BrandMark /> : null}
      <div className="leading-tight">
        <div
          className={cn(
            titleClass,
            'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 bg-clip-text text-transparent'
          )}
        >
          QR-Star
        </div>
        {subtitle ? (
          <div className="text-xs md:text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
    </div>
  )
}
