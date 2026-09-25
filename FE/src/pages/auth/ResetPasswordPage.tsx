import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { authApi } from '../../api/endpoints'
import AlertErrore, { AlertOk } from '../../components/AlertErrore'
import AuthLayout, { Citazione, linkOro, TestaForm } from './AuthLayout'
import CampoPassword from './CampoPassword'

/** Aperta dal link nella mail di reset: /reset-password?token=... */
export default function ResetPasswordPage() {
  const [sp] = useSearchParams()
  const token = sp.get('token')
  const [fatto, setFatto] = useState(false)
  const [errore, setErrore] = useState<unknown>(null)
  const [erroreLocale, setErroreLocale] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dati = new FormData(e.currentTarget)
    const nuova = String(dati.get('nuovaPassword'))
    setErrore(null)
    setErroreLocale(null)
    if (nuova !== String(dati.get('conferma'))) {
      setErroreLocale('Le due password non coincidono.')
      return
    }
    setInCorso(true)
    try {
      await authApi.resetPassword(token ?? '', nuova)
      setFatto(true)
    } catch (err) {
      setErrore(err)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <AuthLayout lato={<Citazione etichetta="Recupero accesso" testo="Una nuova chiave, la stessa passione." />}>
      <TestaForm badge="Recupero accesso" titolo="Nuova password" sottotitolo="Scegli una password di almeno 8 caratteri." />

      {!token ? (
        <AlertErrore errore={new ApiError(400, 'Link non valido: manca il codice di reset. Richiedi una nuova mail.')} />
      ) : fatto ? (
        <div className="space-y-5">
          <AlertOk>Password aggiornata. Ora puoi accedere con quella nuova.</AlertOk>
          <Link to="/accedi" className="btn-oro w-full rounded py-3.5">
            Vai all'accesso
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={invia}>
          <CampoPassword label="Nuova password" name="nuovaPassword" autoComplete="new-password" required minLength={8} autoFocus />
          <CampoPassword label="Conferma password" name="conferma" autoComplete="new-password" required minLength={8} />
          {erroreLocale && <AlertErrore errore={new ApiError(400, erroreLocale)} />}
          <AlertErrore errore={errore} />
          <button type="submit" disabled={inCorso} className="btn-oro w-full rounded py-3.5">
            Aggiorna password
          </button>
        </form>
      )}

      <p className="mt-8 border-t border-line/60 pt-6 text-center text-xs">
        <Link to="/password-dimenticata" className={linkOro}>
          Richiedi un nuovo link
        </Link>
      </p>
    </AuthLayout>
  )
}
