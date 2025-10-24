import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import AppChrome from '@/components/AppChrome'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Matchmaker',
  description: 'Spiele & Turniere finden und anbieten',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={poppins.className}>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}