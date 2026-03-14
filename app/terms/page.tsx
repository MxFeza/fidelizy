import Link from 'next/link'

export const metadata = {
  title: "Conditions Générales d'Utilisation — Izou",
}

export default function TermsPage() {
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
          Conditions Générales d&apos;Utilisation — Izou
        </h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : 14 mars 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Objet</h2>
            <p>
              Izou est une plateforme de carte de fidélité digitale mettant en relation des
              commerçants et leurs clients. Les présentes Conditions Générales d&apos;Utilisation
              (ci-après &laquo;&nbsp;CGU&nbsp;&raquo;) régissent l&apos;accès et l&apos;utilisation
              de la plateforme Izou.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. Inscription et compte
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-gray-700">Commerçant :</span> inscription par
                email et mot de passe, accès sécurisé par OTP (code à usage unique)
              </li>
              <li>
                <span className="font-medium text-gray-700">Client :</span> inscription par prénom,
                numéro de téléphone et adresse email, accès sécurisé par OTP
              </li>
              <li>
                L&apos;utilisateur garantit l&apos;exactitude des informations fournies lors de son
                inscription
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. Programme de fidélité
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Le commerçant définit librement les règles de son programme (type de fidélité,
                paliers, récompenses)
              </li>
              <li>Les points et tampons n&apos;ont pas de valeur monétaire</li>
              <li>Le commerçant peut modifier les paliers et récompenses à tout moment</li>
              <li>
                Les récompenses sont délivrées sous la seule responsabilité du commerçant
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Gamification (roue, missions, parrainage)
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                La roue de la fortune consomme des points — le résultat est déterminé de manière
                aléatoire selon les probabilités configurées par le commerçant
              </li>
              <li>
                Les missions sont soumises à validation du commerçant lorsque applicable
              </li>
              <li>
                Le parrainage donne des points au parrain et au filleul, selon la configuration du
                commerçant
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Notifications</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                L&apos;utilisateur peut activer ou désactiver les notifications push à tout moment
              </li>
              <li>
                Le commerçant peut envoyer des notifications promotionnelles à ses clients abonnés
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Propriété intellectuelle
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Izou, son logo et son interface sont protégés par le droit de la propriété
                intellectuelle
              </li>
              <li>
                Le contenu généré par les commerçants (noms de commerce, récompenses, etc.) reste
                leur propriété
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Responsabilité</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Izou fournit la plateforme &laquo;&nbsp;en l&apos;état&nbsp;&raquo; et ne garantit
                pas l&apos;absence d&apos;interruptions
              </li>
              <li>
                Izou n&apos;est pas responsable des récompenses promises par les commerçants
              </li>
              <li>Des interruptions de service sont possibles pour maintenance</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Résiliation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Le client peut demander la suppression de ses données à tout moment en contactant le
                commerçant ou en écrivant à{' '}
                <a href="mailto:ebellafrancis@gmail.com" className="text-indigo-600 underline">
                  ebellafrancis@gmail.com
                </a>
              </li>
              <li>Le commerçant peut supprimer son compte depuis son profil</li>
              <li>
                Izou se réserve le droit de suspendre un compte en cas d&apos;abus ou de
                non-respect des présentes CGU
              </li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, le tribunal
              compétent sera celui de Lyon.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 underline">
            Politique de confidentialité
          </Link>
          <Link href="/legal" className="text-indigo-600 hover:text-indigo-700 underline">
            Mentions légales
          </Link>
        </div>
      </div>
    </div>
  )
}
