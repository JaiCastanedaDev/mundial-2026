const toneClasses = {
  default: 'bg-primary-light text-ink border border-border',
  live: 'bg-[#3c1714] text-[#ff9b8d] border border-[#6f2e28]',
  success: 'bg-[#173327] text-[#9be1b5] border border-[#2f5c46]',
  warning: 'bg-[#3a2d14] text-accent border border-[#6a5530]',
  dark: 'bg-accent text-primary',
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
