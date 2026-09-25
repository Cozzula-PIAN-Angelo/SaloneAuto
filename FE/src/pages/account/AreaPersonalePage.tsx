import { useEffect } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import Icona from '../../components/Icona'
import { usePreferiti } from '../../preferiti/PreferitiContext'
import { formatPrezzo } from '../../utils/format'
import SezioneAvvisi from './SezioneAvvisi'
import SezionePreferiti from './SezionePreferiti'
import SezioneProfilo from './SezioneProfilo'

// Pagina unica come nel design Stitch: /account/preferiti, /account/avvisi e /account/profilo
// mostrano la stessa pagina e scorrono alla sezione corrispondente.
const SEZIONI = ['preferiti', 'avvisi', 'profilo'] as const

export default function AreaPersonalePage() {
  const { utente, isAdmin, logout } = useAuth()
  const { preferiti } = usePreferiti()
  const { sezione } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (sezione && SEZIONI.includes(sezione as (typeof SEZIONI)[number])) {
      document.getElementById(`sezione-${sezione}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [sezione])

  if (!utente) return null
  const iniziali = `${utente.nome[0]}${utente.cognome[0]}`
  const valore = preferiti.reduce((tot, p) => tot + p.auto.prezzo, 0)

  const voce = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between rounded px-3.5 py-2.5 transition-colors duration-150 ${
      isActive ? 'border-l-[3px] border-gold bg-gold/10 font-semibold text-gold' : 'text-muted hover:bg-card hover:text-gold'
    }`

  return (
    <>
      <section className="border-b border-line/60 bg-gradient-to-b from-surface/80 to-bg">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-medium tracking-widest text-gold uppercase">
                <Icona nome="lock" className="text-[14px]" />
                Area riservata
              </div>
              <h1 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl lg:text-5xl">Il tuo Garage Privato</h1>
              <p className="mt-2 max-w-2xl text-sm font-light text-muted">
                Gestisci la tua selezione di vetture esclusive, monitora le variazioni di prezzo e personalizza il tuo profilo.
              </p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div className="border-r border-line pr-6">
                <span className="block text-[11px] tracking-wider text-muted uppercase">Valore desiderato</span>
                <span className="text-lg font-medium text-gold sm:text-xl">{formatPrezzo(valore)}</span>
              </div>
              <div>
                <span className="block text-[11px] tracking-wider text-muted uppercase">Stato membro</span>
                <span className="mt-0.5 inline-flex items-center text-xs font-semibold tracking-wider text-ink uppercase">
                  <Icona nome="workspace_premium" piena className="mr-1 text-base text-gold" />
                  {isAdmin ? 'Amministratore' : 'Club Privé'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <aside className="w-full flex-shrink-0 rounded-xl border border-line bg-surface p-6 lg:sticky lg:top-28 lg:w-72">
            <div className="flex flex-col items-center border-b border-line pb-6 text-center">
              <div className="relative mb-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gradient-to-br from-card to-bg font-display text-2xl tracking-wider text-gold shadow-lg">
                  {iniziali}
                </div>
                <div className="absolute -right-1 -bottom-1 rounded-full border border-line bg-surface p-1">
                  <Icona nome="verified" piena className="text-base text-gold" />
                </div>
              </div>
              <h2 className="text-base font-semibold tracking-wide text-ink">
                {utente.nome} {utente.cognome}
              </h2>
              <p className="mt-0.5 text-xs font-light break-all text-muted">{utente.email}</p>
            </div>

            <nav className="space-y-1.5 py-5 text-xs font-medium tracking-wider uppercase">
              <NavLink to="/account/preferiti" className={voce}>
                <div className="flex items-center gap-3">
                  <Icona nome="favorite" className="text-lg" />
                  <span>Preferiti</span>
                </div>
                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-bg">{preferiti.length}</span>
              </NavLink>
              <NavLink to="/account/avvisi" className={voce}>
                <div className="flex items-center gap-3">
                  <Icona nome="notifications" className="text-lg" />
                  <span>Avvisi di prezzo</span>
                </div>
              </NavLink>
              <NavLink to="/account/profilo" className={voce}>
                <div className="flex items-center gap-3">
                  <Icona nome="person" className="text-lg" />
                  <span>Profilo</span>
                </div>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={voce}>
                  <div className="flex items-center gap-3">
                    <Icona nome="admin_panel_settings" className="text-lg" />
                    <span>Pannello admin</span>
                  </div>
                </NavLink>
              )}
              <div className="my-2 border-t border-line/80 pt-3 pb-1" />
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex w-full items-center gap-3 rounded px-3.5 py-2.5 text-left tracking-wider text-muted uppercase transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
              >
                <Icona nome="logout" className="text-lg" />
                <span>Esci</span>
              </button>
            </nav>
          </aside>

          <section className="w-full flex-1 space-y-12">
            <SezionePreferiti />
            <SezioneAvvisi />
            <SezioneProfilo />
          </section>
        </div>
      </div>
    </>
  )
}
