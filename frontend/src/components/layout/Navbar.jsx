import { Menu, Trophy, BookOpenText, CalendarRange, LogOut, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/partidos', label: 'Partidos', icon: CalendarRange },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/reglas', label: 'Reglas', icon: BookOpenText },
]

function UserBadge({ profile }) {
  const initials = profile?.display_name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <NavLink to="/perfil" className="flex items-center gap-3 rounded-full border border-border bg-surface/80 px-3 py-2 text-sm text-ink transition hover:border-accent/50">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
        style={{ backgroundColor: profile?.avatar_color ?? '#3B82F6' }}
      >
        {initials ?? '?'}
      </span>
      <span className="hidden sm:block">{profile?.display_name ?? 'Usuario'}</span>
    </NavLink>
  )
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-primary/95 text-ink backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-border bg-surface/70 p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <NavLink to="/partidos" className="font-display text-3xl uppercase text-accent">
            <span className="mr-2 text-ink">⚽</span>Polla 2026
          </NavLink>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm transition',
                  isActive
                    ? 'bg-accent text-primary'
                    : 'text-muted hover:bg-surface/70 hover:text-ink',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <UserBadge profile={profile} />
          <button
            type="button"
            onClick={signOut}
            className="hidden rounded-md border border-border bg-surface/60 px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-ink md:flex md:items-center md:gap-2"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-4 py-3 text-sm',
                    isActive ? 'bg-accent text-primary' : 'bg-surface/70 text-ink',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-md bg-surface/70 px-4 py-3 text-left text-sm text-ink"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
