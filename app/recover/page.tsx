import Image from 'next/image'
import Link from 'next/link'
import RecoverForm from './RecoverForm'

export const metadata = {
  title: 'Retrouver ma carte — Izou',
}

export default function RecoverPage() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <header className="px-5 py-4 border-b border-secondary">
        <Image
          src="/izou-logo.svg"
          alt="Izou"
          width={80}
          height={24}
          priority
          className="h-6 w-auto"
        />
      </header>

      <main className="flex-1 flex flex-col px-5 py-8">
        <RecoverForm />
      </main>

      <footer className="py-6 text-center text-xs text-quaternary space-x-2">
        <Link href="/privacy" className="hover:text-tertiary underline">Confidentialité</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-tertiary underline">CGU</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-tertiary underline">Mentions légales</Link>
      </footer>
    </div>
  )
}
