import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import Icona from '../../components/Icona'

export default function AdminLayout() {
  const { utente, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-xs">
      <aside className="z-30 hidden w-[260px] shrink-0 flex-col justify-between border-r border-line bg-surface select-none md:flex">
        <div className="flex flex-col">
          <Link to="/admin" className="flex h-16 items-center gap-3 border-b border-line px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-gold/40 bg-card text-gold shadow-sm">
              <span className="font-display text-sm font-semibold tracking-tighter">SA</span>
            </div>
            <div className="flex flex-col">
              <div className="font-display text-[13px] leading-tight font-semibold tracking-widest text-ink">SALONE AUTO</div>
              <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-widest text-muted uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Control Panel
              </div>
            </div>
          </Link>
          <div className="px-3 pt-6 pb-2">
            <div className="px-2.5 pb-2 text-[10px] font-semibold tracking-[0.2em] text-muted/60 uppercase">Gestione salone</div>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2.5 transition-all ${
                    isActive ? 'border-l-2 border-gold bg-card font-medium text-gold' : 'text-muted hover:bg-card hover:text-ink'
                  }`
                }
              >
                <Icona nome="directions_car" />
                <span className="text-xs tracking-wider uppercase">Annunci</span>
              </NavLink>
              <Link
                to="/admin?nuovo=1"
                className="group flex items-center gap-3 rounded px-3 py-2.5 text-muted transition-colors hover:bg-card hover:text-ink"
              >
                <Icona nome="add_box" className="transition-colors group-hover:text-gold" />
                <span className="text-xs tracking-wider uppercase">Nuovo annuncio</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="space-y-1 border-t border-line p-3">
          <Link to="/" className="flex items-center gap-2.5 rounded px-3 py-2 text-[11px] tracking-wider text-muted uppercase transition-colors hover:bg-card hover:text-ink">
            <Icona nome="open_in_new" className="text-[16px]" />
            Torna al sito
          </Link>
          {utente && (
            <div className="mt-2 flex items-center justify-between border-t border-line/60 px-2 py-1.5 pt-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line bg-card text-xs font-medium text-gold">
                  {utente.nome[0]}
                  {utente.cognome[0]}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[11px] leading-tight font-medium text-ink">
                    {utente.nome} {utente.cognome}
                  </span>
                  <span className="truncate text-[9px] text-muted">{utente.email}</span>
                </div>
              </div>
              <button
                title="Disconnetti"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="p-1 text-muted transition-colors hover:text-gold"
              >
                <Icona nome="logout" className="text-[16px]" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <Outlet />
    </div>
  )
}
