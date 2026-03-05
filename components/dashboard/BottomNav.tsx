'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ScanLine, Users, Settings, User, LogOut, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/dashboard', label: 'Scanner', icon: ScanLine },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '#insights', label: 'Insights', icon: BarChart3, disabled: true },
  { href: '/dashboard/settings', label: 'Réglages', icon: Settings },
]

interface BottomNavProps {
  businessName: string
}

export default function BottomNav({ businessName }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  return (
    <>
      {/* Profile modal overlay */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{businessName}</p>
                <p className="text-xs text-gray-400">Compte commerçant</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const isDisabled = 'disabled' in tab && tab.disabled
            const isActive = !isDisabled && (tab.href === '/dashboard'
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href + '/'))
            const Icon = tab.icon

            if (isDisabled) {
              return (
                <button
                  key={tab.href}
                  onClick={() => { setToast(true); setTimeout(() => setToast(false), 2000) }}
                  className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-gray-300 relative"
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                  <span className="text-xs font-medium">{tab.label}</span>
                  <span className="absolute -top-1 right-1/2 translate-x-4 text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full leading-none">
                    Bientôt
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              profileOpen ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <User className="w-6 h-6" strokeWidth={profileOpen ? 2.5 : 2} />
            <span className={`text-xs ${profileOpen ? 'font-semibold' : 'font-medium'}`}>
              Profil
            </span>
          </button>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg md:hidden animate-fade-in">
          Disponible bientôt !
        </div>
      )}
    </>
  )
}
