'use client'

export default function CardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Carte introuvable
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Cette carte n'existe pas ou n'est plus disponible.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
