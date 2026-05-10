import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HelpClient from './HelpClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aide & support — Izou',
}

export default async function HelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  return <HelpClient />
}
