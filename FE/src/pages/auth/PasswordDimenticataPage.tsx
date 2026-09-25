import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/endpoints'
import AlertErrore, { AlertOk } from '../../components/AlertErrore'
import Icona from '../../components/Icona'
import AuthLayout, { Citazione, inputAuth, labelAuth, linkOro, TestaForm } from './AuthLayout'

export default function PasswordDimenticataPage() {
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [errore, setErrore] = useState<unknown>(null)
  const [inCorso, setInCorso] = useState(false)

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    setErrore(null)
    setInCorso(true)
    try {
      setMessaggio((await authApi.passwordDimenticata(email)).messaggio)
    } catch (err) {
      setErrore(err)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <AuthLayout lato={<Citazione etichetta="Recupero accesso" testo="Ti riportiamo alla guida in un attimo." />}>
      <TestaForm
        badge="Recupero accesso"
        titolo="Password dimenticata"
        sottotitolo="Inserisci l'email dell'account: ti invieremo un link per sceglierne una nuova."
      />
      {messaggio ? (
        <AlertOk>{messaggio}</AlertOk>
      ) : (
        <form className="space-y-5" onSubmit={invia}>
          <div className="space-y-1.5">
            <label className={labelAuth} htmlFor="email">
              Indirizzo email
            </label>
            <input id="email" name="email" type="email" required autoFocus autoComplete="email" placeholder="nome@esempio.it" className={inputAuth} />
          </div>
          <AlertErrore errore={errore} />
          <button type="submit" disabled={inCorso} className="btn-oro w-full rounded py-3.5">
            <span>Invia link</span>
            <Icona nome="send" className="text-base" />
          </button>
        </form>
      )}
      <p className="mt-8 border-t border-line/60 pt-6 text-center text-xs">
        <Link to="/accedi" className={linkOro}>
          Torna all'accesso
        </Link>
      </p>
    </AuthLayout>
  )
}
