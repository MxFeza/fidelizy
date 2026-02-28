'use client'

import { useState } from 'react'

interface ShortCodeDisplayProps {
  code: string
}

export default function ShortCodeDisplay({ code }: ShortCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
        Mon code fidélité
      </p>
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3">
        <span className="font-mono text-2xl font-bold text-gray-900 tracking-widest">
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="ml-3 shrink-0 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center">
        Communiquez ce code au commerçant si le scan QR n&apos;est pas disponible.
      </p>
    </div>
  )
}
