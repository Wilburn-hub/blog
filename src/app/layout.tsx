import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Personal Blog',
    template: '%s | Personal Blog',
  },
  description: 'A modern personal blog built with Next.js, TypeScript, and Tailwind CSS',
  keywords: ['blog', 'personal', 'nextjs', 'typescript', 'tailwindcss'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-blog-url.com',
    title: 'Personal Blog',
    description: 'A modern personal blog built with Next.js, TypeScript, and Tailwind CSS',
    siteName: 'Personal Blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Blog',
    description: 'A modern personal blog built with Next.js, TypeScript, and Tailwind CSS',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

// Root layout - will be used for the root page only
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}