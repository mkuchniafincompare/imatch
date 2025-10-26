'use client'

import { useState } from 'react'

interface CancelMatchModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title?: string
  message?: string
}

export default function CancelMatchModal({
  open,
  onClose,
  onConfirm,
  title = 'Spiel absagen?',
  message = 'Bist du sicher, dass du das Spiel absagen möchtest? Der Gegner wird darüber benachrichtigt.',
}: CancelMatchModalProps) {
  const [reason, setReason] = useState('')

  if (!open) return null

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-700 mb-4">{message}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Begründung
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Optional: Grund für die Absage..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition"
            >
              Spiel absagen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
