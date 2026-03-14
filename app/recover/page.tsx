import RecoverForm from './RecoverForm'

export const metadata = {
  title: 'Retrouver ma carte — Izou',
}

export default function RecoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-5">
      <RecoverForm />

      <footer className="mt-8 pb-6 text-center text-xs text-gray-400 space-x-3">
        <a href="/privacy" className="hover:text-gray-600 underline">Confidentialité</a>
        <span>·</span>
        <a href="/terms" className="hover:text-gray-600 underline">CGU</a>
        <span>·</span>
        <a href="/legal" className="hover:text-gray-600 underline">Mentions légales</a>
      </footer>
    </div>
  )
}
