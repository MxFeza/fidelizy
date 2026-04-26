import { SubNav } from '@/components/ui/application/app-navigation/sub-nav'

const settingsSubNav = [
  // exact: true pour eviter que "Mon entreprise" reste actif sur les sous-pages
  { label: 'Mon entreprise', href: '/dashboard/settings', exact: true },
  { label: 'Sécurité', href: '/dashboard/settings/security' },
  { label: 'Abonnement', href: '/dashboard/settings/plan' },
  { label: 'Confidentialité', href: '/dashboard/settings/privacy' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <SubNav items={settingsSubNav} />
      {children}
    </div>
  )
}
