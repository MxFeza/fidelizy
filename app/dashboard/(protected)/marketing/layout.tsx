import { SubNav } from '@/components/ui/application/app-navigation/sub-nav'

const marketingSubNav = [
  { label: 'Programme de fidélité', href: '/dashboard/marketing/loyalty' },
  { label: 'Parrainage', href: '/dashboard/marketing/referral' },
  { label: 'Push notifications', href: '/dashboard/marketing/push' },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <SubNav items={marketingSubNav} />
      {children}
    </div>
  )
}
