import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminAutoApi } from '../../api/endpoints'
import { ETICHETTE_CARBURANTE, type AutoResponse, type PaginaResponse, type StatoAnnuncio } from '../../api/types'
import AlertErrore from '../../components/AlertErrore'
import Caricamento from '../../components/Caricamento'
import FotoAuto from '../../components/FotoAuto'
import Icona from '../../components/Icona'
import { OPZIONI_ORDINAMENTO } from '../../utils/filtri'
import { formatData, formatKm, formatPrezzo } from '../../utils/format'
import { primaImmagine } from '../../utils/immagini'
import AutoDrawer from './AutoDrawer'

const DIMENSIONE = 10

interface Contatori {
  totale: number
  pubblicati: number
  bozze: number
}

export default function AdminAutoPage() {
  const [sp, setSp] = useSearchParams()
  const stato = (['BOZZA', 'PUBBLICATO'] as const).find((s) => s === sp.get('stato'))
  const q = sp.get('q') ?? ''
  const pagina = Math.max(0, Number(sp.get('pagina') ?? 1) - 1) || 0
  const ordinamento = OPZIONI_ORDINAMENTO.find((o) => o.valore === sp.get('ordina')) ?? OPZIONI_ORDINAMENTO[0]

  const [risultato, setRisultato] = useState<PaginaResponse<AutoResponse> | null>(null)
  const [contatori, setContatori] = useState<Contatori | null>(null)
  const [errore, setErrore] = useState<unknown>(null)
  // undefined = drawer chiuso, null = nuovo annuncio, AutoResponse = modifica
  const [drawer, setDrawer] = useState<AutoResponse | null | undefined>(undefined)
  const [prezzoInModifica, setPrezzoInModifica] = useState<number | null>(null)

  const carica = useCallback(() => {
    setErrore(null)
    adminAutoApi
      .elenco({ stato, q: q || undefined, ordinaPer: ordinamento.ordinaPer, direzione: ordinamento.direzione, pagina, dimensione: DIMENSIONE })
      .then(setRisultato)
      .catch(setErrore)
    // Contatori: tre richieste da un elemento, basta totaleElementi
    Promise.all([
      adminAutoApi.elenco({ dimensione: 1 }),
      adminAutoApi.elenco({ stato: 'PUBBLICATO', dimensione: 1 }),
      adminAutoApi.elenco({ stato: 'BOZZA', dimensione: 1 }),
    ])
      .then(([t, p, b]) => setContatori({ totale: t.totaleElementi, pubblicati: p.totaleElementi, bozze: b.totaleElementi }))
      .catch(() => setContatori(null))
  }, [stato, q, pagina, ordinamento.ordinaPer, ordinamento.direzione])

  useEffect(carica, [carica])

  // /admin?nuovo=1 (voce "Nuovo annuncio" della sidebar) apre il drawer vuoto
  useEffect(() => {
    if (sp.get('nuovo')) {
      setDrawer(null)
      const next = new URLSearchParams(sp)
      next.delete('nuovo')
      setSp(next, { replace: true })
    }
  }, [sp, setSp])

  const aggiornaQuery = (modifiche: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(modifiche)) {
      if (!v) next.delete(k)
      else next.set(k, v)
    }
    if (!('pagina' in modifiche)) next.delete('pagina')
    setSp(next)
  }

  const cerca = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    aggiornaQuery({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() })
  }

  /** Sostituisce la riga nella tabella senza ricaricare tutto. */
  const sostituisci = (a: AutoResponse) => setRisultato((r) => (r ? { ...r, contenuto: r.contenuto.map((x) => (x.id === a.id ? a : x)) } : r))

  const cambiaStato = async (a: AutoResponse) => {
    const nuovo: StatoAnnuncio = a.statoAnnuncio === 'PUBBLICATO' ? 'BOZZA' : 'PUBBLICATO'
    setErrore(null)
    try {
      sostituisci(await adminAutoApi.aggiornaStato(a.id, nuovo))
      carica()
    } catch (e) {
      setErrore(e)
    }
  }

  const salvaPrezzo = async (a: AutoResponse, valore: string) => {
    setErrore(null)
    try {
      sostituisci(await adminAutoApi.aggiornaPrezzo(a.id, Number(valore)))
      setPrezzoInModifica(null)
    } catch (e) {
      setErrore(e)
    }
  }

  const filtriStato: { v: StatoAnnuncio | undefined; l: string; n?: number }[] = [
    { v: undefined, l: 'Tutti', n: contatori?.totale },
    { v: 'PUBBLICATO', l: 'Pubblicato', n: contatori?.pubblicati },
    { v: 'BOZZA', l: 'Bozza', n: contatori?.bozze },
  ]

  const da = risultato ? risultato.pagina * risultato.dimensione + 1 : 0
  const a = risultato ? da + risultato.contenuto.length - 1 : 0

  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-bg">
      {/* Barra superiore */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-wide text-ink">Annunci</h1>
            <span className="hidden text-xs tracking-wider text-muted uppercase sm:inline">Catalogo flotta</span>
          </div>
          {contatori && (
            <div className="hidden items-center gap-2 border-l border-line pl-4 lg:flex">
              <div className="rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-ink">
                Totale <span className="ml-1 font-mono font-medium text-gold">{contatori.totale}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Pubblicati <span className="ml-1 font-mono">{contatori.pubblicati}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                Bozze <span className="ml-1 font-mono">{contatori.bozze}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded border border-line bg-surface p-2 text-muted hover:text-ink md:hidden" title="Torna al sito">
            <Icona nome="open_in_new" className="text-[16px]" />
          </Link>
          <button
            onClick={() => setDrawer(null)}
            className="flex items-center gap-1.5 rounded bg-gold px-4 py-2 text-xs font-semibold tracking-widest text-bg uppercase shadow-[0_2px_12px_rgba(201,169,110,0.2)] transition-all hover:bg-gold-hover"
          >
            <Icona nome="add" className="text-[18px] font-bold" />
            Nuovo annuncio
          </button>
        </div>
      </header>

      {/* Barra filtri */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-line/80 bg-deep px-4 py-3.5 md:px-8">
        <form className="relative w-full max-w-96" onSubmit={cerca} key={q}>
          <Icona nome="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-[17px] text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cerca nel titolo o nella descrizione..."
            className="w-full rounded border border-line bg-surface py-1.5 pr-4 pl-9 text-xs text-ink placeholder-muted/70 transition-colors focus:border-gold focus:outline-none"
          />
        </form>
        <div className="flex items-center gap-1 rounded border border-line bg-surface p-1">
          {filtriStato.map((f) => (
            <button
              key={f.l}
              onClick={() => aggiornaQuery({ stato: f.v })}
              className={`rounded-[2px] px-3 py-1 text-[11px] tracking-wider uppercase transition-colors ${
                stato === f.v ? 'border border-gold/30 bg-card font-medium text-gold' : 'border border-transparent text-muted hover:text-ink'
              }`}
            >
              {f.l}
              {f.n !== undefined && ` (${f.n})`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] tracking-wider text-muted uppercase">
          <span>Ordina per:</span>
          <select
            value={ordinamento.valore}
            onChange={(e) => aggiornaQuery({ ordina: e.target.value })}
            className="cursor-pointer rounded border border-line bg-surface px-2.5 py-1 pr-7 text-xs text-ink normal-case focus:border-gold focus:outline-none"
          >
            {OPZIONI_ORDINAMENTO.map((o) => (
              <option key={o.valore} value={o.valore}>
                {o.etichetta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Tabella */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8">
        <AlertErrore errore={errore} />
        {!risultato ? (
          !errore && <Caricamento />
        ) : (
          <div className="mt-2 overflow-hidden rounded border border-line bg-surface shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-[#18181D] text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
                    <th className="w-20 px-3 py-3">Foto</th>
                    <th className="px-4 py-3">Veicolo &amp; specifiche</th>
                    <th className="px-3 py-3">Anno</th>
                    <th className="px-3 py-3">Chilometraggio</th>
                    <th className="px-3 py-3">Alimentazione</th>
                    <th className="px-4 py-3">Prezzo</th>
                    <th className="px-3 py-3">Stato</th>
                    <th className="px-3 py-3">Caricato il</th>
                    <th className="px-4 py-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-xs">
                  {risultato.contenuto.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted">
                        Nessun annuncio trovato.
                      </td>
                    </tr>
                  )}
                  {risultato.contenuto.map((auto) => {
                    const inModifica = drawer?.id === auto.id
                    return (
                      <tr key={auto.id} className={`transition-colors ${inModifica ? 'border-l-2 border-gold bg-[#1C1C22]' : 'hover:bg-card/40'}`}>
                        <td className="px-3 py-3.5">
                          <div className={`relative h-10 w-16 overflow-hidden rounded-[2px] border bg-black ${inModifica ? 'border-gold/50' : 'border-line'}`}>
                            <FotoAuto immagine={primaImmagine(auto.immagini)} alt="" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-[13px] font-medium tracking-wide text-ink">
                            <span>{auto.titolo}</span>
                            {inModifica && (
                              <span className="rounded border border-gold/30 bg-gold/10 px-1.5 font-mono text-[9px] text-gold uppercase">In modifica</span>
                            )}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] tracking-tight text-muted">
                            {auto.vin ? `VIN: ${auto.vin}` : `${auto.marca} · ${auto.modello}`}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-ink">{auto.anno}</td>
                        <td className="px-3 py-3.5 font-mono whitespace-nowrap text-ink">{formatKm(auto.chilometraggio)}</td>
                        <td className="px-3 py-3.5 text-muted">{ETICHETTE_CARBURANTE[auto.carburante]}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {prezzoInModifica === auto.id ? (
                            <form
                              className="flex items-center gap-1"
                              onSubmit={(e) => {
                                e.preventDefault()
                                salvaPrezzo(auto, String(new FormData(e.currentTarget).get('prezzo')))
                              }}
                            >
                              <input
                                name="prezzo"
                                type="number"
                                min={0.01}
                                step={0.01}
                                required
                                autoFocus
                                defaultValue={auto.prezzo}
                                aria-label="Nuovo prezzo"
                                className="w-28 rounded border border-line bg-well px-2 py-1 font-mono text-xs text-ink focus:border-gold focus:outline-none"
                              />
                              <button className="p-1 text-gold" title="Salva">
                                <Icona nome="check" className="text-base" />
                              </button>
                              <button type="button" onClick={() => setPrezzoInModifica(null)} className="p-1 text-muted" title="Annulla">
                                <Icona nome="close" className="text-base" />
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => setPrezzoInModifica(auto.id)}
                              className="group flex items-center gap-1.5 font-mono text-[13px] font-semibold text-gold"
                              title="Modifica prezzo"
                            >
                              <span>{formatPrezzo(auto.prezzo)}</span>
                              <Icona nome="edit" className="text-[13px] text-muted group-hover:text-gold" />
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <button
                            onClick={() => cambiaStato(auto)}
                            title={auto.statoAnnuncio === 'PUBBLICATO' ? 'Riporta in bozza' : 'Pubblica'}
                            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase transition-colors ${
                              auto.statoAnnuncio === 'PUBBLICATO'
                                ? 'border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                                : 'border-line bg-card text-muted hover:text-ink'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${auto.statoAnnuncio === 'PUBBLICATO' ? 'bg-gold' : 'bg-neutral-600'}`} />
                            {auto.statoAnnuncio === 'PUBBLICATO' ? 'Pubblicato' : 'Bozza'}
                          </button>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-[11px] text-muted">{formatData(auto.dataCreazione)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setDrawer(auto)}
                            className={`rounded-[2px] px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                              inModifica ? 'bg-gold text-black hover:bg-gold-hover' : 'border border-line text-ink hover:border-gold hover:text-gold'
                            }`}
                          >
                            Modifica
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-line bg-deep px-6 py-3 text-xs text-muted">
              <div>
                {risultato.totaleElementi > 0 ? (
                  <>
                    Mostrando <span className="font-mono text-ink">{`${da} - ${a}`}</span> di{' '}
                    <span className="font-mono text-ink">{risultato.totaleElementi}</span> veicoli a inventario
                  </>
                ) : (
                  'Nessun veicolo'
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={risultato.pagina === 0}
                  onClick={() => aggiornaQuery({ pagina: risultato.pagina === 1 ? undefined : String(risultato.pagina) })}
                  className="rounded-[2px] border border-line px-2.5 py-1 text-muted transition-colors hover:border-gold/40 hover:text-ink disabled:opacity-40"
                >
                  Precedente
                </button>
                <span className="px-2 font-mono font-medium text-gold">
                  {risultato.pagina + 1}
                  <span className="text-muted"> / {Math.max(1, risultato.totalePagine)}</span>
                </span>
                <button
                  disabled={risultato.pagina >= risultato.totalePagine - 1}
                  onClick={() => aggiornaQuery({ pagina: String(risultato.pagina + 2) })}
                  className="rounded-[2px] border border-line px-2.5 py-1 text-muted transition-colors hover:border-gold/40 hover:text-ink disabled:opacity-40"
                >
                  Successivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {drawer !== undefined && <AutoDrawer key={drawer?.id ?? 'nuovo'} auto={drawer} onChiudi={() => setDrawer(undefined)} onSalvato={carica} />}
    </main>
  )
}
