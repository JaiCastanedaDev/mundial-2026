export default function Spinner({ label = 'Cargando' }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span>{label}</span>
    </div>
  )
}
