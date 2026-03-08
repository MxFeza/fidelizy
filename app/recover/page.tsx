import RecoverForm from './RecoverForm'

export const metadata = {
  title: 'Retrouver ma carte — Izou',
}

export default function RecoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-5">
      <RecoverForm />
    </div>
  )
}
