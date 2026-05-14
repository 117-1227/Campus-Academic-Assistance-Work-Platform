export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-xl shadow-slate-900/10 w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header: px-6(24) py-4(16) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 leading-title">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: px-6(24) py-6(24) */}
        <div className="px-6 py-6 overflow-y-auto">{children}</div>

        {/* Footer: px-6(24) py-4(16) gap-3(12) */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
