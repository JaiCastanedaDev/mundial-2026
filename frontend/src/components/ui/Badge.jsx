const toneClasses = {
  default: 'bg-slate-100 text-slate-700',
  live: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  dark: 'bg-primary text-white',
}

export default function Badge({ children, tone = 'default', pulse = false }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-normal',
        toneClasses[tone] ?? toneClasses.default,
        pulse ? 'animate-pulse' : '',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
