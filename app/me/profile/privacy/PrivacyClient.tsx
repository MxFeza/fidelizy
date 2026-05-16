'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Download01 } from '@untitledui/icons'
import SubScreenLayout, { Section, MenuList } from '@/components/client/profile/SubScreenLayout'
import { useToast } from '@/components/client/ToastContainer'
import ExportDataModal from '@/components/client/profile/ExportDataModal'
import DeleteAccountStep1Modal from '@/components/client/profile/DeleteAccountStep1Modal'
import DeleteAccountStep2Modal from '@/components/client/profile/DeleteAccountStep2Modal'
import { createClient } from '@/lib/supabase/client'

interface PrivacyClientProps {
  firstName: string
  cardId: string | null
}

export default function PrivacyClient({ firstName, cardId }: PrivacyClientProps) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [exportModal, setExportModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)

  async function handleDelete() {
    try {
      const res = await fetch('/api/me/delete', { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Suppression impossible.' })
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    }
  }

  return (
    <SubScreenLayout title="Confidentialité & données" cardId={cardId} toast={toast}>
      <Section title="Mes données">
        <MenuList>
          <li>
            <button
              type="button"
              onClick={() => setExportModal(true)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Download01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-gray-900">Exporter mes données</p>
                <p className="text-xs text-gray-500 mt-0.5">Recevez vos données (RGPD art. 20)</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
        </MenuList>
      </Section>

      <Section title="Documents légaux">
        <MenuList>
          <li>
            <Link href="/terms" className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
              <span className="flex-1 text-md font-medium text-gray-900">Conditions générales d&apos;utilisation</span>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
              <span className="flex-1 text-md font-medium text-gray-900">Politique de confidentialité</span>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        </MenuList>
      </Section>

      <Section title="Suppression de compte">
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setDeleteStep(1)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <p className="text-md font-semibold text-red-700">Supprimer mon compte</p>
              <p className="text-xs text-red-700/70 mt-0.5">Action irréversible — lisez l&apos;impact RGPD</p>
            </div>
            <ChevronRight className="size-4 text-red-700/70 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </Section>

      <ExportDataModal
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        customerFirstName={firstName}
        onSuccess={() => showToast({ variant: 'success', title: 'Export téléchargé' })}
        onError={(message) => showToast({ variant: 'error', title: 'Erreur', message })}
      />
      <DeleteAccountStep1Modal
        isOpen={deleteStep === 1}
        onClose={() => setDeleteStep(0)}
        onConfirm={() => setDeleteStep(2)}
      />
      <DeleteAccountStep2Modal
        isOpen={deleteStep === 2}
        onClose={() => setDeleteStep(0)}
        onConfirm={handleDelete}
      />
    </SubScreenLayout>
  )
}
