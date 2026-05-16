export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center gap-3">
          <div className="w-10 h-10 -ml-2 rounded-full bg-gray-100" aria-hidden="true" />
          <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-5 animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-4">
              <div className="size-6 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 w-40 rounded bg-gray-200" />
                <div className="h-2.5 w-56 rounded bg-gray-100" />
              </div>
              <div className="h-2.5 w-10 rounded bg-gray-200 shrink-0 mt-1" />
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
