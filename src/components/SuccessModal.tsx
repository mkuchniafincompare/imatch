'use client'

import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  message: string
}

export default function SuccessModal({ open, onClose, message }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erfolgreich!
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-[#D04D2E] text-white rounded-lg font-medium hover:bg-[#B83D1E] transition"
        >
          OK
        </button>
      </div>
    </div>
  )
}
