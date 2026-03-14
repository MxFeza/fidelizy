'use client'

import { useState, useEffect } from 'react'

interface WheelSegment {
  id: string
  label: string
  emoji: string
  probability: number
}

export interface WheelModalProps {
  cardId: string
  qrCodeId: string
  businessId: string
  color: string
  cardToken: string
  onClose: () => void
  onResult: (newPoints: number) => void
}

const WHEEL_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

export default function WheelModal({ cardId, qrCodeId, businessId, color, cardToken, onClose, onResult }: WheelModalProps) {
  const [segments, setSegments] = useState<WheelSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ label: string; emoji: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/wheel/${qrCodeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.segments) setSegments(data.segments)
        else setError(data.error || 'Roue indisponible')
        setLoading(false)
      })
      .catch(() => {
        setError('Erreur de chargement')
        setLoading(false)
      })
  }, [qrCodeId])

  async function handleSpin() {
    if (spinning || segments.length < 2) return
    setSpinning(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Card-Token': cardToken },
        body: JSON.stringify({ cardId, businessId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur')
        setSpinning(false)
        return
      }

      const winnerIdx = data.winner_index ?? 0
      const segAngle = 360 / segments.length
      const targetAngle = 360 - (winnerIdx * segAngle + segAngle / 2)
      const totalRotation = rotation + 360 * 5 + targetAngle
      setRotation(totalRotation)

      setTimeout(() => {
        setResult({ label: data.prize.label, emoji: data.prize.emoji })
        onResult(data.new_points)
        setSpinning(false)
      }, 4200)
    } catch {
      setError('Erreur réseau')
      setSpinning(false)
    }
  }

  const segAngle = segments.length > 0 ? 360 / segments.length : 360

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(var(--wheel-rotation)); }
        }
      `}</style>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-center mb-4">🎡 Roue de la fortune</h2>

        {loading && <p className="text-center text-gray-400 py-8">Chargement...</p>}

        {error && !loading && (
          <p className="text-center text-red-500 text-sm py-4">{error}</p>
        )}

        {!loading && segments.length >= 2 && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">▼</div>
              <svg
                width="280"
                height="280"
                viewBox="0 0 280 280"
                className="drop-shadow-lg"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {segments.map((seg, i) => {
                  const startAngle = (i * segAngle - 90) * (Math.PI / 180)
                  const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180)
                  const cx = 140, cy = 140, r = 130
                  const x1 = cx + r * Math.cos(startAngle)
                  const y1 = cy + r * Math.sin(startAngle)
                  const x2 = cx + r * Math.cos(endAngle)
                  const y2 = cy + r * Math.sin(endAngle)
                  const largeArc = segAngle > 180 ? 1 : 0
                  const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180)
                  const textR = r * 0.65
                  const tx = cx + textR * Math.cos(midAngle)
                  const ty = cy + textR * Math.sin(midAngle)
                  const textAngle = (i + 0.5) * segAngle

                  return (
                    <g key={seg.id}>
                      <path
                        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      >
                        {seg.emoji} {seg.label.length > 10 ? seg.label.slice(0, 9) + '…' : seg.label}
                      </text>
                    </g>
                  )
                })}
                <circle cx="140" cy="140" r="18" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text x="140" y="140" textAnchor="middle" dominantBaseline="central" fontSize="16">🎡</text>
              </svg>
            </div>

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-lg font-bold text-green-700">{result.emoji} {result.label}</p>
                <p className="text-xs text-green-600 mt-1">Félicitations !</p>
              </div>
            )}

            {!result && (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
                style={{ backgroundColor: color }}
              >
                {spinning ? 'La roue tourne...' : 'Tourner !'}
              </button>
            )}

            {result && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                style={{ borderColor: color, color }}
              >
                Fermer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
