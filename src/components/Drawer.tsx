'use client'

import React from 'react'
import { createPortal } from 'react-dom'

type DrawerSide = 'right' | 'left' | 'bottom'

type DrawerProps = {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  title?: React.ReactNode
  side?: DrawerSide
  children: React.ReactNode
  /** Optional width for left/right drawers (Tailwind class), default: sm:w-80 w-[88%] */
  widthClass?: string
  /** Optional height for bottom drawer (Tailwind class), default: h-[60dvh] sm:h-[70dvh] */
  heightClass?: string
  /** Optional className for container */
  className?: string
}

/**
 * Accessible, lightweight Drawer with overlay.
 * - Uses Tailwind classes for sizing and transitions
 * - Closes on overlay click or Escape key
 * - Positions: right (default), left, bottom
 */
export default function Drawer({
  open,
  isOpen,
  onClose,
  title,
  side = 'right',
  children,
  widthClass,
  heightClass,
  className = '',
}: DrawerProps) {
  const OPEN = typeof open === 'boolean' ? open : !!isOpen

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (OPEN) {
      document.addEventListener('keydown', onKey)
      // prevent body scroll while open
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onKey)
        document.body.style.overflow = prev
      }
    }
  }, [OPEN, onClose])

  const isSide = side === 'left' || side === 'right'
  const W = widthClass ?? 'w-[88%] sm:w-80'
  const H = heightClass ?? 'h-[60dvh] sm:h-[70dvh]'

  const positionClass =
    side === 'right'
      ? 'top-0 bottom-0 right-0'
      : side === 'left'
      ? 'top-0 bottom-0 left-0'
      : 'left-0 right-0 bottom-0'

  const sizeClass = side === 'bottom' ? H : W
  const baseClass =
    'fixed z-[70] bg-black/80 text-white border border-white/20 shadow-2xl rounded-tl-2xl rounded-tr-none rounded-bl-none backdrop-blur-xl overflow-hidden'

  const translateClosed =
    side === 'right'
      ? 'translate-x-full'
      : side === 'left'
      ? '-translate-x-full'
      : 'translate-y-full'

  const translateOpen = 'translate-x-0 translate-y-0'

  // Drawer soll komplett unsichtbar sein wenn geschlossen
  if (!OPEN) {
    return null
  }

  const drawerContent = (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={[
          baseClass,
          positionClass,
          sizeClass,
          'transition-transform duration-300 ease-out',
          'flex flex-col',
          translateOpen,
          className,
        ].join(' ')}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/20 bg-white/5">
          <div className="text-base font-semibold text-white truncate">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition text-white/80 hover:text-white"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-4 text-sm text-white">
          {children}
        </div>
      </aside>
    </>
  )

  // Portal zum body, damit der Drawer vom kompletten Viewport begrenzt wird
  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body)
  }

  return null
}