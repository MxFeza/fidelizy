'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScanLine, Users, Settings, User, BarChart3, Printer } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Scanner', icon: ScanLine },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/print-qr', label: 'QR Code', icon: Printer },
  { href: '#insights', label: 'Insights', icon: BarChart3, disabled: true },
  { href: '/dashboard/settings', label: 'Réglages', icon: Settings },
]

interface BottomNavProps {
  businessName: string
}

export default function BottomNav(_props: BottomNavProps) {
  const pathname = usePathname()
  const [toast, setToast] = useState(false)

  const isProfileActive = pathname.startsWith('/dashboard/profile')

  return (
    <>
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
          <Link
            href="/dashboard/profile"
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              isProfileActive ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <User className="w-6 h-6" strokeWidth={isProfileActive ? 2.5 : 2} />
            <span className={`text-xs ${isProfileActive ? 'font-semibold' : 'font-medium'}`}>
              Profil
            </span>
          </Link>
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
