'use client'

import { useState } from 'react'
import { ChevronDown, Mail01, MessageCircle01 } from '@untitledui/icons'
import SubScreenLayout, { Section, MenuList } from '@/components/client/profile/SubScreenLayout'
import { useToast } from '@/components/client/ToastContainer'
import FeedbackModal from '@/components/client/profile/FeedbackModal'
import { cx } from '@/utils/cx'

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Comment fonctionne ma carte ?',
    answer: 'Votre carte fidélité est activée automatiquement chez chaque commerçant Izou que vous visitez. Le commerçant scanne votre QR code à chaque passage et vous gagnez des tampons (ou points). Une fois la carte remplie, vous obtenez la récompense.',
  },
  {
    question: 'Qu\'est-ce que le parrainage ?',
    answer: 'Si un commerçant a activé son programme de parrainage, vous pouvez inviter vos amis. Chaque ami qui s\'inscrit grâce à votre lien vous donne un bonus (et lui aussi). Retrouvez votre lien dans l\'onglet Parrainage de la carte du commerce.',
  },
  {
    question: 'Mon commerçant n\'a pas Izou, que faire ?',
    answer: 'Parlez-en à votre commerçant ! Vous pouvez aussi nous transmettre son nom à contact@izou.fr — nous le contactons pour lui présenter Izou.',
  },
  {
    question: 'Récupérer une carte perdue',
    answer: 'Connectez-vous avec votre numéro de téléphone ou email à izou.fr — vos cartes sont automatiquement restaurées sur votre nouvel appareil.',
  },
]

interface HelpClientProps {
  cardId: string | null
}

export default function HelpClient({ cardId }: HelpClientProps) {
  const { toast, showToast } = useToast()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [feedbackModal, setFeedbackModal] = useState(false)

  return (
    <SubScreenLayout title="Aide & support" cardId={cardId} toast={toast}>
      <Section title="Questions fréquentes">
        <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {FAQ.map((item, i) => {
            const open = openIndex === i
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex-1 text-md font-medium text-gray-900">{item.question}</span>
                  <ChevronDown
                    className={cx('size-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                {open ? (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title="Nous contacter">
        <MenuList>
          <li>
            <a
              href="mailto:contact@izou.fr"
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <Mail01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-gray-900">Envoyer un e-mail à l&apos;équipe</p>
                <p className="text-xs text-gray-500 mt-0.5">contact@izou.fr</p>
              </div>
            </a>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setFeedbackModal(true)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <MessageCircle01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-md font-medium text-gray-900">Envoyer un feedback depuis l&apos;app</span>
            </button>
          </li>
        </MenuList>
      </Section>

      <FeedbackModal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        onSent={() =>
          showToast({
            variant: 'success',
            title: 'Merci pour votre feedback !',
            message: 'Nous l\'avons bien reçu.',
          })
        }
        onError={(message) => showToast({ variant: 'error', title: 'Erreur', message })}
      />
    </SubScreenLayout>
  )
}
