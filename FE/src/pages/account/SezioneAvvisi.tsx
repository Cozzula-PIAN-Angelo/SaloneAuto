import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { autoApi, avvisiApi } from '../../api/endpoints'
import type { AutoResponse, AvvisoResponse } from '../../api/types'
import AlertErrore from '../../components/AlertErrore'
import Caricamento from '../../components/Caricamento'
import FotoAuto from '../../components/FotoAuto'
import Icona from '../../components/Icona'
import { formatData, formatPrezzo } from '../../utils/format'
import { primaImmagine } from '../../utils/immagini'

export default function SezioneAvvisi() {
  const [avvisi, setAvvisi] = useState<AvvisoResponse[] | null>(null)
  // L'AvvisoResponse non ha la foto: le auto si caricano a parte (solo per la miniatura)
  const [auto, setAuto] = useState<Record<number, AutoResponse>>({})
  const [errore, setErrore] = useState<unknown>(null)
  const [inModifica, setInModifica] = useState<number | null>(null)
  const [bozzaSoglia, setBozzaSoglia] = useState('')

  useEffect(() => {
    avvisiApi
      .elenco()
      .then((lista) => {
        setAvvisi(lista)
        const ids = [...new Set(lista.map((a) => a.autoId))]
        Promise.allSettled(ids.map((id) => autoApi.dettaglio(id))).then((esiti) => {
          const mappa: Record<number, AutoResponse> = {}
          esiti.forEach((e) => e.status === 'fulfilled' && (mappa[e.value.id] = e.value))
          setAuto(mappa)
        })
      })
      .catch(setErrore)
  }, [])

  const sostituisci = (a: AvvisoResponse) => setAvvisi((prev) => prev?.map((x) => (x.id === a.id ? a : x)) ?? null)

  const esegui = async (op: () => Promise<void>) => {
    setErrore(null)
    try {
      await op()
    } catch (e) {
      setErrore(e)
    }
  }

  const toggleAttivo = (a: AvvisoResponse) => esegui(async () => sostituisci(await avvisiApi.aggiorna(a.id, { soglia: a.soglia, attivo: !a.attivo })))

  const salvaSoglia = (a: AvvisoResponse) =>
    esegui(async () => {
      sostituisci(await avvisiApi.aggiorna(a.id, { soglia: Number(bozzaSoglia), attivo: a.attivo }))
      setInModifica(null)
    })

  const elimina = (a: AvvisoResponse) =>
    esegui(async () => {
      await avvisiApi.elimina(a.id)
      setAvvisi((prev) => prev?.filter((x) => x.id !== a.id) ?? null)
    })

  return (
    <div id="sezione-avvisi" className="scroll-mt-28 space-y-5 border-t border-line pt-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium tracking-widest text-gold uppercase">
            <Icona nome="notifications_active" className="text-sm" />
            Monitoraggio quotazioni
          </div>
          <h2 className="font-display text-2xl font-normal text-ink">Monitoraggio Soglie di Prezzo</h2>
          <p className="mt-1 max-w-xl text-xs font-light text-muted">
            Ricevi una notifica non appena una vettura che segui raggiunge il valore impostato.
          </p>
        </div>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded border border-line bg-card px-3.5 py-2 text-xs text-ink transition hover:bg-line"
        >
          <Icona nome="add" className="text-sm text-gold" />
          <span>Nuovo avviso</span>
        </Link>
      </div>

      <AlertErrore errore={errore} />

      {avvisi === null ? (
        !errore && <Caricamento />
      ) : avvisi.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong p-8 text-sm text-muted">
          Nessun avviso attivo. Apri un annuncio e imposta una soglia nel riquadro “Avviso di prezzo”.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-card/40 text-[11px] tracking-wider text-muted uppercase">
                  <th className="px-5 py-3.5 font-medium">Auto e versione</th>
                  <th className="px-4 py-3.5 font-medium">Prezzo attuale</th>
                  <th className="px-4 py-3.5 font-medium">Soglia desiderata</th>
                  <th className="px-4 py-3.5 text-center font-medium">Stato</th>
                  <th className="px-4 py-3.5 font-medium">Ultima notifica</th>
                  <th className="px-5 py-3.5 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs">
                {avvisi.map((a) => {
                  const dettaglio = auto[a.autoId]
                  const differenza = a.prezzoAttuale - a.soglia
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-card/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-12 flex-shrink-0 overflow-hidden rounded border border-line bg-black">
                            <FotoAuto immagine={dettaglio && primaImmagine(dettaglio.immagini)} alt="" />
                          </div>
                          <div>
                            <Link to={`/auto/${a.autoId}`} className="font-medium text-ink transition-colors hover:text-gold">
                              {a.titoloAuto}
                            </Link>
                            {dettaglio && (
                              <span className="block text-[10px] text-muted">
                                {dettaglio.anno} · {dettaglio.marca}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium whitespace-nowrap text-ink">{formatPrezzo(a.prezzoAttuale)}</td>
                      <td className="px-4 py-4 font-semibold whitespace-nowrap text-gold">
                        {inModifica === a.id ? (
                          <form
                            className="flex items-center gap-1.5"
                            onSubmit={(e) => {
                              e.preventDefault()
                              salvaSoglia(a)
                            }}
                          >
                            <input
                              type="number"
                              min={0.01}
                              step={0.01}
                              required
                              autoFocus
                              value={bozzaSoglia}
                              onChange={(e) => setBozzaSoglia(e.target.value)}
                              aria-label="Nuova soglia"
                              className="w-28 rounded border border-line bg-bg px-2 py-1 text-xs text-ink focus:border-gold focus:outline-none"
                            />
                            <button type="submit" className="p-1 text-gold hover:text-gold-hover" title="Salva">
                              <Icona nome="check" className="text-base" />
                            </button>
                            <button type="button" onClick={() => setInModifica(null)} className="p-1 text-muted hover:text-ink" title="Annulla">
                              <Icona nome="close" className="text-base" />
                            </button>
                          </form>
                        ) : (
                          formatPrezzo(a.soglia)
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {a.attivo ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Attivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-0.5 text-[10px] font-medium text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                            In pausa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-ink">{formatData(a.ultimaNotifica)}</span>
                        <span className={`block text-[10px] font-medium ${differenza <= 0 ? 'text-emerald-400' : 'text-muted'}`}>
                          {differenza <= 0 ? 'Sotto soglia' : `mancano ${formatPrezzo(differenza)}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            title="Modifica soglia"
                            onClick={() => {
                              setInModifica(a.id)
                              setBozzaSoglia(String(a.soglia))
                            }}
                            className="rounded p-1.5 text-muted transition hover:bg-card hover:text-gold"
                          >
                            <Icona nome="edit" className="text-base" />
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={a.attivo}
                            aria-label={a.attivo ? 'Metti in pausa' : 'Riattiva'}
                            onClick={() => toggleAttivo(a)}
                            className={`relative h-5 w-9 rounded-full p-0.5 transition-colors ${a.attivo ? 'bg-gold' : 'bg-line'}`}
                          >
                            <span
                              className={`block h-4 w-4 rounded-full transition-transform ${a.attivo ? 'translate-x-4 bg-bg' : 'translate-x-0 bg-muted'}`}
                            />
                          </button>
                          <button
                            type="button"
                            title="Elimina avviso"
                            onClick={() => elimina(a)}
                            className="rounded p-1.5 text-muted transition hover:bg-card hover:text-red-400"
                          >
                            <Icona nome="delete" className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
