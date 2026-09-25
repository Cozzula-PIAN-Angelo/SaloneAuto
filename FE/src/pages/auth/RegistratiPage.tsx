import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import AlertErrore from '../../components/AlertErrore'
import Icona from '../../components/Icona'
import AuthLayout, { linkOro } from './AuthLayout'
import CampoPassword from './CampoPassword'

const PRIVILEGI = [
  { icona: 'favorite', titolo: 'Salva le auto preferite', testo: 'Crea la tua lista dei desideri e ritrovala da qualsiasi dispositivo.' },
  { icona: 'notifications_active', titolo: 'Ricevi avvisi quando il prezzo scende', testo: 'Scegli una soglia: ti scriviamo appena il prezzo la supera al ribasso.' },
  { icona: 'lock_open', titolo: 'Accesso rapido al catalogo completo', testo: 'Tutte le vetture disponibili, con filtri e ordinamenti salvati nel link.' },
]

/** Robustezza indicativa 0–4: lunghezza, maiuscole/minuscole, cifre, simboli. */
function robustezza(pw: string): number {
  if (pw.length < 8) return pw.length > 0 ? 1 : 0
  let punti = 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) punti++
  if (/\d/.test(pw)) punti++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) punti++
  return punti
}
const LIVELLI = ['', 'Debole', 'Discreta', 'Buona', 'Forte']

const inputReg =
  'w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-xs text-ink placeholder:text-muted/40 transition-colors duration-150 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none'
const labelReg = 'block text-[11px] font-medium tracking-wider text-muted uppercase'

export default function RegistratiPage() {
  const { utente, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destinazione = (location.state as { da?: string } | null)?.da
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<unknown>(null)
  const [inCorso, setInCorso] = useState(false)

  if (utente) return <Navigate to={destinazione ?? '/'} replace />

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dati = new FormData(e.currentTarget)
    const email = String(dati.get('email')).trim()
    setErrore(null)
    setInCorso(true)
    try {
      await authApi.registrazione({
        nome: String(dati.get('nome')).trim(),
        cognome: String(dati.get('cognome')).trim(),
        email,
        password,
      })
      // Registrazione riuscita: accesso diretto con le stesse credenziali
      await login(email, password)
      navigate(destinazione ?? '/', { replace: true })
    } catch (err) {
      setErrore(err)
      setInCorso(false)
    }
  }

  const livello = robustezza(password)

  return (
    <AuthLayout
      immagine="/img/registrati.jpg"
      lato={
        <>
          <div className="mb-4 inline-block rounded-sm border border-line bg-card/80 px-3 py-1 text-[10px] font-semibold tracking-widest text-gold uppercase backdrop-blur-md">
            Esperienza riservata
          </div>
          <h2 className="mb-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">I privilegi dell'iscrizione</h2>
          <p className="mb-8 max-w-md text-xs leading-relaxed font-light text-muted sm:text-sm">
            Accedi all'area riservata per gestire la tua collezione e monitorare i modelli più prestigiosi.
          </p>
          <ul className="max-w-md space-y-5">
            {PRIVILEGI.map((p) => (
              <li key={p.titolo} className="group flex items-start gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-gold/40 bg-surface/85 text-gold shadow-sm transition-colors group-hover:border-gold">
                  <Icona nome={p.icona} className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium tracking-wide text-ink">{p.titolo}</p>
                  <p className="mt-0.5 text-xs font-light text-muted">{p.testo}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-center gap-2 border-t border-line/80 pt-6 text-[11px] text-muted">
            <Icona nome="verified_user" className="text-sm text-gold" />
            <span>Dati riservati: la password è salvata cifrata e non viene mai mostrata.</span>
          </div>
        </>
      }
    >
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-widest text-gold uppercase">Salone Auto Club</span>
          <span className="text-line">•</span>
          <span className="text-[10px] tracking-wider text-muted uppercase">Registrazione</span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Crea il tuo account</h1>
        <p className="mt-2 text-xs leading-relaxed font-light text-muted sm:text-sm">
          Inserisci i tuoi dati per un'esperienza sartoriale nel mondo delle auto di prestigio.
        </p>
      </div>

      <form className="space-y-4" onSubmit={invia}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="nome" className={labelReg}>
              Nome
            </label>
            <input id="nome" name="nome" required maxLength={50} autoFocus autoComplete="given-name" placeholder="Mario" className={inputReg} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cognome" className={labelReg}>
              Cognome
            </label>
            <input id="cognome" name="cognome" required maxLength={50} autoComplete="family-name" placeholder="Rossi" className={inputReg} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className={labelReg}>
            Indirizzo email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="mario.rossi@esempio.it"
              className={`${inputReg} pl-10`}
            />
            <Icona nome="mail" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted" />
          </div>
        </div>

        <CampoPassword
          label="Password"
          name="password"
          hint="Almeno 8 caratteri"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        >
          <div className="space-y-1 pt-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted">Robustezza:</span>
              <span className="font-medium text-gold">{LIVELLI[livello]}</span>
            </div>
            <div className="grid h-1 grid-cols-4 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-full rounded-full ${i <= livello ? 'bg-gold' : 'bg-line'}`} />
              ))}
            </div>
          </div>
        </CampoPassword>

        <label className="flex cursor-pointer items-start gap-2.5 pt-2 select-none">
          <input type="checkbox" required className="mt-0.5 cursor-pointer accent-gold" />
          <span className="text-[11px] leading-relaxed text-muted">
            Accetto i Termini di Servizio e l'Informativa sulla Privacy di Salone Auto.
          </span>
        </label>

        <AlertErrore errore={errore} />

        <div className="pt-3">
          <button type="submit" disabled={inCorso} className="btn-oro group w-full py-3.5 shadow-lg">
            <span>{inCorso ? 'Creazione account…' : 'Registrati'}</span>
            <Icona nome="arrow_forward" className="text-base transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-line pt-6 text-center">
        <p className="text-xs text-muted">
          Hai già un account?
          <Link to="/accedi" state={location.state} className={`${linkOro} ml-1`}>
            Accedi
          </Link>
        </p>
      </div>
      <div className="mt-4 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] tracking-wider text-muted uppercase transition-colors hover:text-ink">
          <Icona nome="arrow_back" className="text-sm" />
          <span>Torna allo showroom</span>
        </Link>
      </div>
    </AuthLayout>
  )
}
