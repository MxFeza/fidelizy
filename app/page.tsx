'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('Le code doit contenir 6 caractères.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('short_code', trimmed)
      .single()

    if (!business) {
      setError('Code invalide. Vérifiez le code auprès du commerçant.')
      setLoading(false)
      return
    }

    router.push(`/join/${business.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Fidelizy</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Rejoignez le programme de fidélité<br />de votre commerçant préféré
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Entrez le code du commerce</h2>
          <p className="text-sm text-gray-400 mb-6">
            6 caractères, disponible auprès du commerçant
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().slice(0, 6))
                  setError('')
                }}
                placeholder="Ex: CAF3X9"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="w-full text-center font-mono text-3xl font-bold tracking-[0.3em] uppercase px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-200 placeholder:font-normal placeholder:tracking-normal placeholder:text-lg"
              />
              {error && (
                <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm shadow-sm shadow-indigo-200"
            >
              {loading ? 'Recherche…' : 'Rejoindre →'}
            </button>
          </form>
        </div>

        {/* Merchant link */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Vous êtes commerçant ?{' '}
          <a href="/dashboard" className="text-indigo-600 font-medium hover:underline">
            Accéder au tableau de bord
          </a>
        </p>
      </div>
    </div>
  )
}
