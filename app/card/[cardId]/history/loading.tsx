import Image from 'next/image'

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          <Image src="/izou-logo.svg" alt="Izou" width={84} height={20} priority />
          <div className="w-10 h-10 rounded-full bg-gray-100" aria-hidden="true" />
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-5 space-y-2">
          <h1 className="text-2xl font-bold text-gray-400 leading-tight">Historique</h1>
          <div className="h-3.5 w-56 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-3 w-10 rounded bg-gray-200" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-32 rounded bg-gray-200" />
                <div className="h-2.5 w-24 rounded bg-gray-100" />
              </div>
              <div className="h-3 w-10 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100"
        aria-hidden="true"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-md mx-auto h-16" />
      </nav>
    </div>
  )
}
