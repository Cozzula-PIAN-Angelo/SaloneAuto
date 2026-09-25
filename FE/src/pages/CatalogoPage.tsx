import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { autoApi } from '../api/endpoints'
import {
  CARBURANTI,
  CONDIZIONI,
  ETICHETTE_CARBURANTE,
  ETICHETTE_CONDIZIONE,
  type AutoResponse,
  type PaginaResponse,
} from '../api/types'
import AlertErrore from '../components/AlertErrore'
import AutoCard from '../components/AutoCard'
import Caricamento from '../components/Caricamento'
import Icona from '../components/Icona'
import Paginazione from '../components/Paginazione'
import { leggiParametri, OPZIONI_ORDINAMENTO } from '../utils/filtri'
import { formatKm, formatPrezzo } from '../utils/format'
import { useMarche } from '../utils/useMarche'

const DIMENSIONE = 12
const KM_SLIDER_MAX = 150_000
const ANNO_CORRENTE = new Date().getFullYear()
const ANNI = Array.from({ length: 12 }, (_, i) => ANNO_CORRENTE + 1 - i)

// Campi di testo/numero della sidebar: la bozza vive nel form finché non si preme "Applica"
const CAMPI_FORM = ['q', 'marca', 'modello', 'prezzoMin', 'prezzoMax', 'annoMin', 'annoMax'] as const

const chip = (attivo: boolean) =>
  `cursor-pointer rounded-sm border px-2.5 py-1 text-[10px] tracking-wider uppercase transition-all ${
    attivo ? 'border-gold bg-gold/10 font-medium text-gold' : 'border-line bg-card text-muted hover:text-ink'
  }`

export default function CatalogoPage() {
  const [sp, setSp] = useSearchParams()
  const parametri = leggiParametri(sp)
  const chiave = sp.toString()
  const marche = useMarche()

  const [risultato, setRisultato] = useState<PaginaResponse<AutoResponse> | null>(null)
  const [errore, setErrore] = useState<unknown>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [filtriAperti, setFiltriAperti] = useState(false)

  useEffect(() => {
    let annullato = false
    setCaricamento(true)
    setErrore(null)
    autoApi
      .cerca({ ...leggiParametri(new URLSearchParams(chiave)), dimensione: DIMENSIONE })
      .then((r) => !annullato && setRisultato(r))
      .catch((e) => !annullato && setErrore(e))
      .finally(() => !annullato && setCaricamento(false))
    return () => {
      annullato = true
    }
  }, [chiave])

  /** Aggiorna la query string; ogni cambio di filtro riparte da pagina 1. */
  const aggiorna = (modifiche: Record<string, string | undefined>, resetPagina = true) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(modifiche)) {
      if (v === undefined || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (resetPagina) next.delete('pagina')
    setSp(next)
  }

  const applica = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dati = new FormData(e.currentTarget)
    const modifiche: Record<string, string | undefined> = {}
    for (const c of CAMPI_FORM) modifiche[c] = String(dati.get(c) ?? '').trim()
    const km = Number(dati.get('kmMax'))
    modifiche.kmMax = km >= KM_SLIDER_MAX ? undefined : String(km)
    aggiorna(modifiche)
    setFiltriAperti(false)
  }

  const azzera = () => {
    const ordina = sp.get('ordina')
    setSp(ordina ? { ordina } : {})
    setFiltriAperti(false)
  }

  const cambiaPagina = (p: number) => {
    aggiorna({ pagina: p === 0 ? undefined : String(p + 1) }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Badge dei filtri attivi (rimovibili singolarmente)
  const attivi: { chiave: string; etichetta: string }[] = []
  if (parametri.q) attivi.push({ chiave: 'q', etichetta: `“${parametri.q}”` })
  if (parametri.marca) attivi.push({ chiave: 'marca', etichetta: parametri.marca })
  if (parametri.modello) attivi.push({ chiave: 'modello', etichetta: parametri.modello })
  if (parametri.carburante) attivi.push({ chiave: 'carburante', etichetta: ETICHETTE_CARBURANTE[parametri.carburante] })
  if (parametri.condizione) attivi.push({ chiave: 'condizione', etichetta: ETICHETTE_CONDIZIONE[parametri.condizione] })
  if (parametri.prezzoMin !== undefined) attivi.push({ chiave: 'prezzoMin', etichetta: `Min ${formatPrezzo(parametri.prezzoMin)}` })
  if (parametri.prezzoMax !== undefined) attivi.push({ chiave: 'prezzoMax', etichetta: `Max ${formatPrezzo(parametri.prezzoMax)}` })
  if (parametri.annoMin !== undefined) attivi.push({ chiave: 'annoMin', etichetta: `Dal ${parametri.annoMin}` })
  if (parametri.annoMax !== undefined) attivi.push({ chiave: 'annoMax', etichetta: `Fino al ${parametri.annoMax}` })
  if (parametri.kmMax !== undefined) attivi.push({ chiave: 'kmMax', etichetta: `Max ${formatKm(parametri.kmMax)}` })

  const ordinaCorrente = sp.get('ordina') ?? OPZIONI_ORDINAMENTO[0].valore

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-12 pb-20 md:px-12">
      {/* Barra risultati */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-widest text-gold uppercase">Showroom esclusivo</span>
            <span className="text-line">•</span>
            <span className="text-[11px] tracking-wider text-muted uppercase">Selezione verificata</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl lg:text-5xl">Catalogo Vetture</h1>
          <p className="mt-1 text-sm text-muted">
            {risultato ? (
              <>
                <span className="font-medium text-ink">{risultato.totaleElementi}</span>{' '}
                {risultato.totaleElementi === 1 ? "veicolo d'eccellenza disponibile" : "veicoli d'eccellenza disponibili"} per
                consegna immediata
              </>
            ) : (
              ' '
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltriAperti(true)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3.5 py-2.5 text-xs tracking-wider text-ink uppercase lg:hidden"
          >
            <Icona nome="tune" className="text-base text-gold" />
            Filtri{attivi.length > 0 && ` (${attivi.length})`}
          </button>
          <label className="hidden text-xs tracking-wider whitespace-nowrap text-muted uppercase sm:block" htmlFor="catalog-sort">
            Ordina per:
          </label>
          <div className="relative min-w-[210px]">
            <select
              id="catalog-sort"
              value={ordinaCorrente}
              onChange={(e) => aggiorna({ ordina: e.target.value })}
              className="w-full cursor-pointer appearance-none rounded-sm border border-line bg-surface px-3.5 py-2.5 pr-8 text-xs tracking-wider text-ink uppercase transition-colors duration-150 focus:border-gold focus:outline-none"
            >
              {OPZIONI_ORDINAMENTO.map((o) => (
                <option key={o.valore} value={o.valore}>
                  {o.etichetta}
                </option>
              ))}
            </select>
            <Icona nome="expand_more" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base text-muted" />
          </div>
        </div>
      </div>

      {/* Filtri attivi */}
      {attivi.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
          <span className="mr-2 text-xs tracking-wider text-muted uppercase">Filtri attivi:</span>
          {attivi.map((f) => (
            <span key={f.chiave} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs text-ink">
              {f.etichetta}
              <button
                onClick={() => aggiorna({ [f.chiave]: undefined })}
                aria-label={`Rimuovi filtro ${f.etichetta}`}
                className="flex items-center text-muted transition-colors hover:text-gold"
              >
                <Icona nome="close" className="text-xs" />
              </button>
            </span>
          ))}
          <button onClick={azzera} className="ml-2 text-xs tracking-wider text-gold uppercase hover:underline">
            Rimuovi tutti
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* ===== Sidebar filtri ===== */}
        <aside
          className={`${
            filtriAperti ? 'fixed inset-0 z-[60] overflow-y-auto bg-bg/95 p-4' : 'hidden'
          } lg:sticky lg:top-24 lg:col-span-4 lg:block lg:bg-transparent lg:p-0 xl:col-span-3`}
        >
          {/* key: il form si rimonta quando cambia l'URL, così i campi riflettono i filtri correnti */}
          <form key={chiave} onSubmit={applica} className="space-y-6 rounded-lg border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <Icona nome="tune" className="text-gold" />
                <h2 className="font-display text-base font-semibold tracking-wide whitespace-nowrap text-ink">Filtri di Ricerca</h2>
              </div>
              <button
                type="button"
                onClick={filtriAperti ? () => setFiltriAperti(false) : azzera}
                className="text-xs tracking-wider text-muted uppercase transition-colors hover:text-gold"
              >
                {filtriAperti ? <Icona nome="close" /> : 'Azzera'}
              </button>
            </div>

            <div>
              <label className="etichetta" htmlFor="f-q">
                Ricerca veloce
              </label>
              <div className="relative">
                <input id="f-q" name="q" defaultValue={parametri.q} placeholder="Cerca modello o parola chiave..." className="campo pl-9" />
                <Icona nome="search" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted" />
              </div>
            </div>

            <div>
              <label className="etichetta" htmlFor="f-marca">
                Marca
              </label>
              <div className="relative">
                <select id="f-marca" name="marca" defaultValue={parametri.marca ?? ''} className="campo cursor-pointer appearance-none pr-8">
                  <option value="">Tutti i costruttori</option>
                  {marche.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {parametri.marca && !marche.includes(parametri.marca) && <option value={parametri.marca}>{parametri.marca}</option>}
                </select>
                <Icona nome="expand_more" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm text-muted" />
              </div>
            </div>

            <div>
              <label className="etichetta" htmlFor="f-modello">
                Modello specifico
              </label>
              <input id="f-modello" name="modello" defaultValue={parametri.modello} placeholder="Es. 911, Roma, Urus..." className="campo" />
            </div>

            <div>
              <span className="etichetta">Condizione</span>
              <div className="grid grid-cols-3 gap-1.5">
                {CONDIZIONI.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => aggiorna({ condizione: parametri.condizione === c ? undefined : c })}
                    className={`${chip(parametri.condizione === c)} py-1.5 text-center text-[11px]`}
                  >
                    {ETICHETTE_CONDIZIONE[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="etichetta">Alimentazione</span>
              <div className="flex flex-wrap gap-1.5">
                {CARBURANTI.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => aggiorna({ carburante: parametri.carburante === c ? undefined : c })}
                    className={chip(parametri.carburante === c)}
                  >
                    {ETICHETTE_CARBURANTE[c]}
                    {parametri.carburante === c && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] tracking-wider text-muted uppercase">
                <span>Prezzo (€)</span>
                <span className="text-gold">Min - Max</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="prezzoMin" type="number" min={0} step={1000} placeholder="Min" defaultValue={parametri.prezzoMin} className="campo" />
                <input name="prezzoMax" type="number" min={0} step={1000} placeholder="Max" defaultValue={parametri.prezzoMax} className="campo" />
              </div>
            </div>

            <div>
              <span className="etichetta">Anno immatricolazione</span>
              <div className="grid grid-cols-2 gap-2">
                <select name="annoMin" defaultValue={parametri.annoMin ?? ''} className="campo cursor-pointer" aria-label="Anno minimo">
                  <option value="">Da qualsiasi</option>
                  {ANNI.map((a) => (
                    <option key={a} value={a}>
                      Da {a}
                    </option>
                  ))}
                </select>
                <select name="annoMax" defaultValue={parametri.annoMax ?? ''} className="campo cursor-pointer" aria-label="Anno massimo">
                  <option value="">Fino a oggi</option>
                  {ANNI.map((a) => (
                    <option key={a} value={a}>
                      Fino al {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SliderKm iniziale={parametri.kmMax ?? KM_SLIDER_MAX} />

            <div className="space-y-2 border-t border-line pt-4">
              <button type="submit" className="btn-oro w-full">
                <Icona nome="filter_alt" className="text-sm" />
                <span>Applica filtri</span>
              </button>
              <button type="button" onClick={azzera} className="w-full py-2.5 text-center text-xs tracking-wider text-muted uppercase transition-colors hover:text-ink">
                Azzera filtri
              </button>
            </div>
          </form>
        </aside>

        {/* ===== Griglia risultati ===== */}
        <section className="space-y-8 lg:col-span-8 xl:col-span-9">
          {errore ? (
            <AlertErrore errore={errore} />
          ) : caricamento && !risultato ? (
            <Caricamento />
          ) : risultato && risultato.contenuto.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-strong px-6 py-20 text-center">
              <Icona nome="search_off" className="text-4xl text-gold" />
              <h2 className="font-display text-2xl text-ink">Nessun veicolo corrisponde ai filtri</h2>
              <p className="text-sm text-muted">Prova ad allargare la ricerca o rimuovere qualche filtro.</p>
              <button onClick={azzera} className="btn-linea">
                Azzera filtri
              </button>
            </div>
          ) : (
            risultato && (
              <>
                <div className={`grid grid-cols-1 gap-6 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${caricamento ? 'opacity-50' : ''}`}>
                  {risultato.contenuto.map((a) => (
                    <AutoCard key={a.id} auto={a} />
                  ))}
                </div>
                <Paginazione pagina={risultato.pagina} totalePagine={risultato.totalePagine} onCambia={cambiaPagina} />
              </>
            )
          )}
        </section>
      </div>

      {/* Banner concierge */}
      <section className="relative mt-20 overflow-hidden rounded-lg border border-line bg-surface p-8 md:p-10">
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-gold/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold uppercase">
              <Icona nome="verified" className="text-sm" />
              <span>Servizio Concierge su misura</span>
            </div>
            <h3 className="mb-2 font-display text-2xl font-bold text-ink md:text-3xl">Non trovi la vettura dei tuoi desideri?</h3>
            <p className="text-sm leading-relaxed text-muted">
              I nostri car hunter internazionali possono reperire e certificare qualsiasi modello da collezione tramite la rete
              riservata di Salone Auto a Milano, Zurigo e Londra.
            </p>
          </div>
          <a href="mailto:concierge@saloneauto.it" className="btn-oro px-6 py-3.5 whitespace-nowrap">
            Richiedi ricerca dedicata
          </a>
        </div>
      </section>
    </div>
  )
}

/** Slider del km massimo: stato locale, si riallinea all'URL quando il form viene rimontato. */
function SliderKm({ iniziale }: { iniziale: number }) {
  const [km, setKm] = useState(Math.min(iniziale, KM_SLIDER_MAX))
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-[11px] tracking-wider uppercase">
        <label htmlFor="f-km" className="text-muted">
          Chilometraggio
        </label>
        <span className="font-medium text-gold">{km >= KM_SLIDER_MAX ? 'Qualsiasi' : `Fino a ${formatKm(km)}`}</span>
      </div>
      <input
        id="f-km"
        name="kmMax"
        type="range"
        min={0}
        max={KM_SLIDER_MAX}
        step={5000}
        value={km}
        onChange={(e) => setKm(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted">
        <span>0 km</span>
        <span>150.000+ km</span>
      </div>
    </div>
  )
}
