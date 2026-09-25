import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { avvisiApi } from '../api/endpoints'
import AlertErrore, { AlertOk } from '../components/AlertErrore'
import Caricamento from '../components/Caricamento'
import Icona from '../components/Icona'

/** Aperta dal link "disattiva" nella mail di notifica prezzo: /avvisi/disattiva?token=... (non richiede login). */
export default function DisattivaAvvisoPage() {
  const [sp] = useSearchParams()
  const token = sp.get('token')
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [errore, setErrore] = useState<unknown>(null)
  const inviato = useRef(false)

  useEffect(() => {
    // StrictMode monta due volte gli effetti in sviluppo: la richiesta parte una sola volta
    if (!token || inviato.current) return
    inviato.current = true
    avvisiApi
      .disattivaConToken(token)
      .then((r) => setMessaggio(r.messaggio))
      .catch(setErrore)
  }, [token])

  return (
    <div className="flex justify-center px-6 pt-24 pb-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-5 rounded-lg border border-line bg-surface px-10 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-card text-gold">
          <Icona nome="notifications_off" className="text-2xl" />
        </div>
        <h1 className="font-display text-3xl text-ink">Avviso di prezzo</h1>
        <div className="w-full text-left">
          {!token ? (
            <AlertErrore errore={new ApiError(400, "Link non valido: manca il codice dell'avviso.")} />
          ) : messaggio ? (
            <AlertOk>{messaggio}. Non riceverai altre email per questa auto.</AlertOk>
          ) : errore ? (
            <AlertErrore errore={errore} />
          ) : (
            <Caricamento testo="Disattivazione in corso…" />
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/account/avvisi" className="btn-linea px-4 py-2.5">
            Gestisci i tuoi avvisi
          </Link>
          <Link to="/catalogo" className="px-4 py-2.5 text-xs tracking-widest text-muted uppercase hover:text-ink">
            Torna al catalogo
          </Link>
        </div>
      </div>
    </div>
  )
}
