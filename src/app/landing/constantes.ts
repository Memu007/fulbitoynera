import { Inter } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

// Paleta compartida de la landing
export const C = {
  bg: '#0E1416',
  surface: '#161D21',
  surface2: '#1F282D',
  line: 'rgba(255,255,255,0.08)',
  text: '#E8EDF0',
  muted: '#9AA7AD',
  accent: '#22D3A6', // menta — CTA
  accentDark: '#0F9D77',
  amber: '#FBBF24',
  blue: '#3B82F6',
  red: '#EF4444',
  chalk: '#1E5E3A',
  chalkDark: '#173F2A',
} as const
