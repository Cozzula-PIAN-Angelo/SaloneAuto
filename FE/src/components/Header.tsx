import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePreferiti } from '../preferiti/PreferitiContext'
import Icona from './Icona'
import Logo from './Logo'

const linkNav = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 pb-1 transition-colors duration-150 ${
    isActive ? 'border-b border-gold font-medium text-gold' : 'border-b border-transparent text-muted hover:text-ink'
  }`

export default function Header() {
  const { utente, isAdmin, logout } = useAuth()
  const { preferiti } = usePreferiti()
  const navigate = useNavigate()
  const [aperto, setAperto] = useState(false)
  const chiudi = () => setAperto(false)

  const esci = () => {
    logout()
    chiudi()
    navigate('/')
  }

  const voci = (
    <>
      <NavLink to="/catalogo" className={linkNav} onClick={chiudi}>
        Catalogo
      </NavLink>
      <NavLink to="/account/preferiti" className={linkNav} onClick={chiudi}>
        <span>Preferiti</span>
        {preferiti.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-bg">
            {preferiti.length}
          </span>
        )}
      </NavLink>
      <NavLink to="/account/avvisi" className={linkNav} onClick={chiudi}>
        Avvisi
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkNav} onClick={chiudi}>
          Admin
        </NavLink>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-12">
        <Logo onClick={chiudi} />

        <nav className="hidden items-center gap-10 text-xs tracking-wider uppercase md:flex">{voci}</nav>

        <div className="flex items-center gap-4">
          {utente ? (
            <>
              <Link to="/account/profilo" className="group flex items-center gap-3" onClick={chiudi}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-card font-display text-sm text-gold transition-colors group-hover:border-gold">
                  {utente.nome[0]}
                  {utente.cognome[0]}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block text-xs leading-none font-medium tracking-wider text-ink">
                    {utente.nome} {utente.cognome}
                  </span>
                  <span className="mt-1 block text-[10px] tracking-widest text-gold uppercase">
                    {isAdmin ? 'Amministratore' : 'Club Privé'}
                  </span>
                </span>
              </Link>
              <button
                onClick={esci}
                className="hidden items-center gap-1 text-xs tracking-wider text-muted uppercase transition-colors hover:text-gold sm:flex"
                title="Esci"
              >
                <Icona nome="logout" className="text-lg" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/accedi"
                className="hidden rounded-lg border border-transparent px-3 py-2 text-xs tracking-wider text-muted uppercase transition-colors duration-150 hover:border-line hover:text-gold sm:inline-block"
              >
                Accedi
              </Link>
              <Link
                to="/registrati"
                className="rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold tracking-wider text-bg uppercase shadow-sm transition-all duration-200 hover:bg-gold-hover active:scale-95"
              >
                Registrati
              </Link>
            </>
          )}
          <button
            aria-label="Menu"
            aria-expanded={aperto}
            className="text-muted hover:text-ink md:hidden"
            onClick={() => setAperto((v) => !v)}
          >
            <Icona nome={aperto ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {aperto && (
        <nav className="flex flex-col gap-5 border-t border-line px-6 py-6 text-xs tracking-wider uppercase md:hidden">
          {voci}
          {utente ? (
            <button onClick={esci} className="text-left text-muted uppercase hover:text-gold">
              Esci
            </button>
          ) : (
            <Link to="/accedi" onClick={chiudi} className="text-muted hover:text-gold">
              Accedi
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
