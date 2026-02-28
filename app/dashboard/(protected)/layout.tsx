import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard/login')
  }

  // businesses.id = auth.users.id (relation 1:1)
  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, primary_color')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar businessName={business?.business_name ?? 'Mon Commerce'} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
