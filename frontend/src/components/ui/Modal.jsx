export default function Modal({ open, title, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-4 md:items-center md:justify-center">
      <div className="panel w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase">{title}</h2>
          <button className="text-sm text-slate-500" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
