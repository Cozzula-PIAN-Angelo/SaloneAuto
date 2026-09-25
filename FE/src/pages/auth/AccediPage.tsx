import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import AlertErrore from '../../components/AlertErrore'
import Icona from '../../components/Icona'
import AuthLayout, { Citazione, inputAuth, labelAuth, linkOro, TestaForm } from './AuthLayout'
import CampoPassword from './CampoPassword'

export default function AccediPage() {
  const { utente, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destinazione = (location.state as { da?: string } | null)?.da
  const [errore, setErrore] = useState<unknown>(null)
  const [inCorso, setInCorso] = useState(false)

  if (utente) return <Navigate to={destinazione ?? '/'} replace />

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dati = new FormData(e.currentTarget)
    setErrore(null)
    setInCorso(true)
    try {
      const me = await login(String(dati.get('email')), String(dati.get('password')))
      navigate(destinazione ?? (me.ruolo === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      setErrore(err)
      setInCorso(false)
    }
  }

  return (
    <AuthLayout lato={<Citazione etichetta="Showroom privé" testo="Ogni viaggio inizia con una scelta." />}>
      <TestaForm
        badge="Area riservata"
        titolo="Bentornato"
        sottotitolo="Accedi per gestire i veicoli salvati e ricevere avvisi esclusivi di prezzo."
      />

      <form className="space-y-5" onSubmit={invia}>
        <div className="space-y-1.5">
          <label className={labelAuth} htmlFor="email">
            Indirizzo email
          </label>
          <div className="group relative">
            <input id="email" name="email" type="email" required autoFocus autoComplete="email" placeholder="nome@esempio.it" className={inputAuth} />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted transition-colors group-focus-within:text-gold">
              <Icona nome="mail" className="text-[18px]" />
            </span>
          </div>
        </div>

        <CampoPassword label="Password" name="password" autoComplete="current-password" required />

        <div className="flex items-center justify-end pt-0.5 text-xs">
          <Link to="/password-dimenticata" className={linkOro}>
            Password dimenticata?
          </Link>
        </div>

        <AlertErrore errore={errore} />

        <button type="submit" disabled={inCorso} className="btn-oro w-full rounded py-3.5">
          <span>{inCorso ? 'Accesso in corso…' : 'Accedi'}</span>
          <Icona nome="arrow_forward" className="text-base" />
        </button>
      </form>

      <div className="mt-8 space-y-3 border-t border-line/60 pt-6 text-center">
        <p className="text-xs text-muted">
          Non hai ancora un account?
          <Link to="/registrati" state={location.state} className={`${linkOro} ml-1`}>
            Registrati
          </Link>
        </p>
      </div>

      <div className="mt-10 flex items-center justify-center gap-4 text-[10px] tracking-widest text-faint uppercase">
        <span className="flex items-center gap-1">
          <Icona nome="lock" className="text-[13px] text-gold/70" />
          Connessione protetta
        </span>
        <span>•</span>
        <span>Certificato VIN verificato</span>
      </div>
    </AuthLayout>
  )
}
