'use client'

export default function ConfettiEffect({ color }: { color: string }) {
  const PIECES = 32
  const palette = [color, '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotateZ(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotateZ(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
        {Array.from({ length: PIECES }).map((_, i) => {
          const left = `${((i / PIECES) * 95 + (i % 5)).toFixed(1)}%`
          const duration = `${(2.2 + (i % 5) * 0.28).toFixed(2)}s`
          const delay = `${(i * 0.08).toFixed(2)}s`
          const size = 6 + (i % 7)
          const bg = palette[i % palette.length]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left,
                width: size,
                height: size,
                backgroundColor: bg,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                animationName: 'confettiFall',
                animationDuration: duration,
                animationDelay: delay,
                animationFillMode: 'forwards',
                animationTimingFunction: 'ease-in',
              }}
            />
          )
        })}
      </div>
    </>
  )
}
