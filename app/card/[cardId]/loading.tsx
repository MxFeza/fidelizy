import Image from 'next/image'

export default function CardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          <Image src="/izou-logo.svg" alt="Izou" width={84} height={20} priority />
          <div className="flex items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gray-100" aria-hidden="true" />
            <div className="w-10 h-10 rounded-full bg-gray-100" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold text-gray-400 leading-tight">Chargement…</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-5 animate-pulse">
        <div
          className="-mx-5 p-4 sm:p-6 lg:p-8 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, #B6C3FF 0%, transparent 45%), radial-gradient(circle at 75% 75%, #F8BFA1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C49AE6 0%, transparent 55%), linear-gradient(135deg, #DBC4F2 0%, #E8B0BC 100%)',
          }}
        >
          <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl flex aspect-[1.585/1] bg-gray-400">
            <div className="flex-[0.62] flex flex-col justify-between p-4 sm:p-5">
              <div className="h-6 w-28 rounded bg-white/30" />
              <div className="space-y-2">
                <div className="h-2.5 w-20 rounded bg-white/25" />
                <div className="h-4 w-24 rounded bg-white/30" />
              </div>
            </div>
            <div className="flex-[0.38] bg-gray-300/60" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-purple-300" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-44 rounded bg-gray-200" />
            <div className="h-3 w-6 rounded bg-gray-200" />
          </div>
        </div>

        <div className="h-12 w-full rounded-2xl bg-purple-200" />

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-2.5 w-24 rounded bg-gray-200" />
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-7 w-20 rounded-lg bg-gray-100 mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="h-3 w-16 rounded bg-gray-200" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-32 rounded bg-gray-200" />
                <div className="h-2.5 w-20 rounded bg-gray-100" />
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
