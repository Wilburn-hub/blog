import { redirect } from 'next/navigation'

// Root page - redirect to default locale
export default function RootPage() {
  // Check for user's language preference from cookie or browser
  // For now, redirect to Chinese as default
  redirect('/zh')
}