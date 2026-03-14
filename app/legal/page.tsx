import Link from 'next/link'

export const metadata = {
  title: 'Mentions légales — Izou',
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mentions légales — Izou</h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : 14 mars 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Éditeur</h2>
            <p>
              Francis Collins Ebella
              <br />
              Entrepreneur individuel
              <br />
              Email :{' '}
              <a href="mailto:ebellafrancis@gmail.com" className="text-indigo-600 underline">
                ebellafrancis@gmail.com
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Hébergement</h2>
            <p>
              Vercel Inc.
              <br />
              340 S Lemon Ave #4133, Walnut, CA 91789, USA
              <br />
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                https://vercel.com
              </a>
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Base de données</h2>
            <p>
              Supabase Inc.
              <br />
              Région : eu-west (Union européenne)
              <br />
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                https://supabase.com
              </a>
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble du contenu du site Izou (textes, interface, code source) est protégé
              par le droit d&apos;auteur. Toute reproduction, même partielle, est interdite sans
              autorisation préalable écrite de l&apos;éditeur.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Protection des données
            </h2>
            <p>
              Consultez notre{' '}
              <Link href="/privacy" className="text-indigo-600 underline">
                Politique de confidentialité
              </Link>{' '}
              pour connaître les modalités de collecte et de traitement de vos données personnelles.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>
              Pour toute question ou demande :{' '}
              <a href="mailto:ebellafrancis@gmail.com" className="text-indigo-600 underline">
                ebellafrancis@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 underline">
            Politique de confidentialité
          </Link>
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 underline">
            Conditions d&apos;utilisation
          </Link>
        </div>
      </div>
    </div>
  )
}
