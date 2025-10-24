'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState('Überprüfe Bestätigung …')

  useEffect(() => {
    const token = params.get('token')
    if (!token) return setMessage('Ungültiger Link.')
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('E-Mail erfolgreich bestätigt! 🎉')
          setTimeout(() => router.replace('/matches'), 1500)
        } else {
          setMessage(data.error || 'Bestätigung fehlgeschlagen.')
        }
      })
      .catch(() => setMessage('Serverfehler.'))
  }, [params, router])

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 text-center">
      <p className="text-gray-800">{message}</p>
    </main>
  )
}