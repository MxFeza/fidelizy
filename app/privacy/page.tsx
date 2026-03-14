import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — Izou',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Politique de confidentialité — Izou
        </h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : 14 mars 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. Responsable du traitement
            </h2>
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
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Données collectées</h2>
            <p className="font-medium text-gray-700 mb-1">Clients :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prénom, numéro de téléphone, adresse email</li>
              <li>Date d&apos;anniversaire (optionnel)</li>
              <li>
                Historique de transactions (tampons, points, récompenses)
              </li>
              <li>Données de navigation (visites PWA)</li>
            </ul>
            <p className="font-medium text-gray-700 mt-3 mb-1">Commerçants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email, mot de passe (hashé)</li>
              <li>Nom du commerce, configuration de fidélité</li>
            </ul>
            <p className="font-medium text-gray-700 mt-3 mb-1">Données techniques :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse IP (rate limiting)</li>
              <li>Tokens de notification push</li>
              <li>Identifiants Apple Wallet</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. Finalités du traitement
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-gray-700">
                  Gestion du programme de fidélité
                </span>{' '}
                — base légale : exécution du contrat
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Envoi de notifications push
                </span>{' '}
                — base légale : consentement
              </li>
              <li>
                <span className="font-medium text-gray-700">
                  Sécurité et prévention des abus
                </span>{' '}
                — base légale : intérêt légitime
              </li>
              <li>
                <span className="font-medium text-gray-700">Statistiques anonymisées</span> — base
                légale : intérêt légitime
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Durée de conservation
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-gray-700">Données client :</span> conservées tant
                que le compte est actif, supprimées sur demande ou après 36 mois d&apos;inactivité
              </li>
              <li>
                <span className="font-medium text-gray-700">Données commerçant :</span> conservées
                tant que le compte est actif
              </li>
              <li>
                <span className="font-medium text-gray-700">Logs techniques :</span> 90 jours
                maximum
              </li>
              <li>
                <span className="font-medium text-gray-700">Codes OTP :</span> 10 minutes
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Partage des données
            </h2>
            <p className="font-medium text-gray-700 mb-1">Sous-traitants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase — base de données (serveurs UE)</li>
              <li>
                Vercel — hébergement (USA — couvert par les clauses contractuelles types)
              </li>
              <li>Apple — notifications Wallet</li>
              <li>Upstash — rate limiting</li>
            </ul>
            <p className="mt-3">Aucune vente de données à des tiers.</p>
            <p>
              Aucun transfert hors UE sauf Vercel (couvert par les clauses contractuelles types).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Vos droits (articles 15 à 21 du RGPD)
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (&laquo;&nbsp;droit à l&apos;oubli&nbsp;&raquo;)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition</li>
              <li>Droit de retirer votre consentement (notifications)</li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits :{' '}
              <a href="mailto:ebellafrancis@gmail.com" className="text-indigo-600 underline">
                ebellafrancis@gmail.com
              </a>
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. Cookies et stockage local
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>localStorage : préférences d&apos;affichage, token de session</li>
              <li>Aucun cookie publicitaire ou de tracking tiers</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Sécurité</h2>
            <p>
              Chiffrement TLS, authentification OTP, rate limiting, tokens HMAC signés, Row Level
              Security PostgreSQL.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Modifications</h2>
            <p>
              En cas de modification de la présente politique, les utilisateurs seront informés via
              notification push ou email.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              10. Contact et réclamation
            </h2>
            <p>
              Contact :{' '}
              <a href="mailto:ebellafrancis@gmail.com" className="text-indigo-600 underline">
                ebellafrancis@gmail.com
              </a>
            </p>
            <p className="mt-2">
              Vous pouvez introduire une réclamation auprès de la CNIL :{' '}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                www.cnil.fr
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 underline">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/legal" className="text-indigo-600 hover:text-indigo-700 underline">
            Mentions légales
          </Link>
        </div>
      </div>
    </div>
  )
}
