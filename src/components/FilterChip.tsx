'use client'

import React from 'react'

export type FilterChipProps = {
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  leading?: React.ReactNode
  className?: string
  title?: string
  'aria-label'?: string
}

/**
 * Reusable filter chip for mobile UI.
 * - Active: inverted (white bg, black text) for high contrast
 * - Inactive: ghost/outlined on glass backgrounds
 */
export default function FilterChip({
  active,
  disabled,
  onClick,
  children,
  leading,
  className = '',
  title,
  'aria-label': ariaLabel,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={[
        // Base
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition',
        'backdrop-blur',
        // States
        active
          ? 'bg-white text-black border border-black shadow-md'
          : 'bg-white/10 border border-white/30 text-white/85 hover:bg-white/20',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {leading ? <span className="text-[13px] -ml-0.5">{leading}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  )
}
