import { useState, type FormEvent } from 'react'
import { profiloApi } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import AlertErrore, { AlertOk } from '../../components/AlertErrore'
import Icona from '../../components/Icona'

const inputProfilo =
  'w-full rounded border border-line bg-bg px-3.5 py-2.5 text-xs text-ink transition-colors focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none disabled:opacity-60'

export default function SezioneProfilo() {
  const { utente, aggiornaUtente } = useAuth()
  const [errore, setErrore] = useState<unknown>(null)
  const [salvato, setSalvato] = useState(false)
  const [inCorso, setInCorso] = useState(false)
  if (!utente) return null

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dati = new FormData(e.currentTarget)
    setErrore(null)
    setSalvato(false)
    setInCorso(true)
    try {
      aggiornaUtente(
        await profiloApi.aggiorna({
          nome: String(dati.get('nome')).trim(),
          cognome: String(dati.get('cognome')).trim(),
        }),
      )
      setSalvato(true)
    } catch (err) {
      setErrore(err)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div id="sezione-profilo" className="scroll-mt-28 space-y-6 border-t border-line pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-normal text-ink">Dati Personali</h2>
          <p className="mt-1 text-xs font-light text-muted">Nome e cognome compaiono nell'area riservata e nelle email di notifica.</p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
          <Icona nome="lock" className="text-sm text-gold" />
          Dati protetti
        </span>
      </div>

      <form onSubmit={invia} className="space-y-6 rounded-xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="etichetta mb-2" htmlFor="p-nome">
              Nome
            </label>
            <input id="p-nome" name="nome" required maxLength={50} defaultValue={utente.nome} className={inputProfilo} />
          </div>
          <div>
            <label className="etichetta mb-2" htmlFor="p-cognome">
              Cognome
            </label>
            <input id="p-cognome" name="cognome" required maxLength={50} defaultValue={utente.cognome} className={inputProfilo} />
          </div>
          <div className="sm:col-span-2">
            <label className="etichetta mb-2" htmlFor="p-email">
              Indirizzo email
            </label>
            <input id="p-email" value={utente.email} disabled className={inputProfilo} />
            <span className="mt-1 block text-[11px] text-faint">L'email identifica l'account e non è modificabile.</span>
          </div>
        </div>

        {salvato && <AlertOk>Modifiche salvate.</AlertOk>}
        <AlertErrore errore={errore} />

        <div className="flex items-center justify-end border-t border-line pt-4">
          <button
            type="submit"
            disabled={inCorso}
            className="rounded border border-gold px-6 py-2.5 text-xs font-semibold tracking-widest text-gold uppercase shadow-sm transition-all duration-200 hover:bg-gold hover:text-bg disabled:opacity-50"
          >
            Salva modifiche
          </button>
        </div>
      </form>
    </div>
  )
}
