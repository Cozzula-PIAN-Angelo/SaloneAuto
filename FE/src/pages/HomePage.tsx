import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { autoApi } from '../api/endpoints'
import { CARBURANTI, ETICHETTE_CARBURANTE, type AutoResponse } from '../api/types'
import AutoCard from '../components/AutoCard'
import Caricamento from '../components/Caricamento'
import Icona from '../components/Icona'
import { useMarche } from '../utils/useMarche'

const selectCls =
  'w-full cursor-pointer appearance-none rounded-lg border border-line bg-card px-3 py-2.5 text-xs text-ink transition-all focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none'
const labelCls = 'mb-1.5 block pl-1 text-[10px] font-bold tracking-widest text-muted uppercase'

// Filtri rapidi dell'hero: scorciatoie verso il catalogo già filtrato
const FILTRI_RAPIDI = [
  { etichetta: 'Km 0', query: 'condizione=KM_0' },
  { etichetta: 'Nuove', query: 'condizione=NUOVO' },
  { etichetta: 'Elettriche', query: 'carburante=ELETTRICA' },
  { etichetta: 'Ibride', query: 'carburante=IBRIDA' },
  { etichetta: 'Sotto € 150.000', query: 'prezzoMax=150000' },
]

const VANTAGGI = [
  {
    icona: 'notifications_active',
    titolo: 'Avvisi di prezzo',
    testo: "Ricevi un'email non appena il prezzo del veicolo che segui scende sotto la soglia che hai scelto.",
    nota: 'Monitoraggio 24/7',
  },
  {
    icona: 'verified',
    titolo: 'Veicoli certificati VIN',
    testo: 'Ogni auto è verificata sul numero di telaio: marca, modello, anno e allestimento senza sorprese.',
    nota: 'Report storico certificato',
  },
  {
    icona: 'sync_saved_locally',
    titolo: 'Preferiti sempre con te',
    testo: 'Salva le vetture che ti interessano e ritrovale da qualsiasi dispositivo, con prezzi sempre aggiornati.',
    nota: 'Sincronizzazione cloud',
  },
]

function Freccia({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs tracking-widest text-gold uppercase transition-colors group-hover:text-ink">
      <span>{children}</span>
      <Icona nome="arrow_forward" className="text-sm transition-transform group-hover:translate-x-1" />
    </span>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const marche = useMarche()
  const [ultimi, setUltimi] = useState<AutoResponse[] | null>(null)
  const [erroreUltimi, setErroreUltimi] = useState(false)

  useEffect(() => {
    autoApi
      .cerca({ ordinaPer: 'data', direzione: 'desc', pagina: 0, dimensione: 3 })
      .then((p) => setUltimi(p.contenuto))
      .catch(() => setErroreUltimi(true))
  }, [])

  const cerca = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const params = new URLSearchParams()
    for (const [k, v] of new FormData(e.currentTarget).entries()) {
      if (typeof v === 'string' && v.trim()) params.set(k, v.trim())
    }
    navigate(`/catalogo?${params}`)
  }

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-6 py-16 md:px-12">
        <div className="absolute inset-0 z-0">
          <div className="h-full w-full scale-105 bg-[url('/img/hero.jpg')] bg-cover bg-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0B0D_95%)]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">
              Collezione riservata {new Date().getFullYear()}
            </span>
          </div>
          <h1 className="mb-6 max-w-4xl font-display text-4xl leading-[1.15] font-bold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            L'eccellenza, pronta a partire.
          </h1>
          <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Scopri una selezione sartoriale delle migliori vetture di prestigio, certificate per superare ogni aspettativa
            attraverso controlli rigorosi e garanzia d'origine.
          </p>

          <div className="w-full max-w-5xl rounded-xl border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur-xl md:p-6">
            <form className="grid grid-cols-1 items-end gap-3 md:grid-cols-12 md:gap-4" onSubmit={cerca}>
              <div className="relative text-left md:col-span-4">
                <label className={labelCls} htmlFor="hero-q">
                  Ricerca libera
                </label>
                <div className="relative flex items-center">
                  <Icona nome="search" className="absolute left-3 text-[18px] text-muted" />
                  <input
                    id="hero-q"
                    name="q"
                    placeholder="Cerca modello o parola chiave..."
                    className="w-full rounded-lg border border-line bg-card py-2.5 pr-3 pl-9 text-xs text-ink placeholder-muted/60 transition-all focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-left md:col-span-2">
                <label className={labelCls} htmlFor="hero-marca">
                  Marca
                </label>
                <div className="relative">
                  <select id="hero-marca" name="marca" className={selectCls} defaultValue="">
                    <option value="">Tutte le marche</option>
                    {marche.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <Icona nome="expand_more" className="pointer-events-none absolute top-2.5 right-2.5 text-sm text-muted" />
                </div>
              </div>
              <div className="text-left md:col-span-2">
                <label className={labelCls} htmlFor="hero-carb">
                  Alimentazione
                </label>
                <div className="relative">
                  <select id="hero-carb" name="carburante" className={selectCls} defaultValue="">
                    <option value="">Qualsiasi</option>
                    {CARBURANTI.map((c) => (
                      <option key={c} value={c}>
                        {ETICHETTE_CARBURANTE[c]}
                      </option>
                    ))}
                  </select>
                  <Icona nome="expand_more" className="pointer-events-none absolute top-2.5 right-2.5 text-sm text-muted" />
                </div>
              </div>
              <div className="text-left md:col-span-2">
                <label className={labelCls} htmlFor="hero-prezzo">
                  Prezzo max
                </label>
                <div className="relative">
                  <select id="hero-prezzo" name="prezzoMax" className={selectCls} defaultValue="">
                    <option value="">Nessun limite</option>
                    <option value="100000">Fino a € 100.000</option>
                    <option value="150000">Fino a € 150.000</option>
                    <option value="200000">Fino a € 200.000</option>
                    <option value="300000">Fino a € 300.000</option>
                  </select>
                  <Icona nome="expand_more" className="pointer-events-none absolute top-2.5 right-2.5 text-sm text-muted" />
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-xs font-bold tracking-wider text-bg uppercase shadow-md transition-all duration-200 hover:bg-gold-hover active:scale-95"
                >
                  <Icona nome="search" className="text-[18px]" />
                  <span>Cerca</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
            <span className="text-[11px] tracking-wider uppercase">Filtri rapidi:</span>
            {FILTRI_RAPIDI.map((f) => (
              <Link
                key={f.etichetta}
                to={`/catalogo?${f.query}`}
                className="rounded border border-line bg-surface/80 px-2.5 py-1 text-[11px] text-ink transition-colors hover:border-gold/40 hover:bg-card"
              >
                {f.etichetta}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ULTIMI ARRIVI ===== */}
      <section className="mx-auto max-w-7xl border-t border-line px-6 py-20 md:px-12">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-gold" />
              <span className="kicker">Disponibilità immediata</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">Ultimi Arrivi in Showroom</h2>
            <p className="mt-1 max-w-xl text-xs text-muted md:text-sm">
              Nuovi ingressi selezionati e certificati dai nostri specialisti con perizia d'eccellenza.
            </p>
          </div>
          <Link to="/catalogo" className="group">
            <Freccia>Esplora intero catalogo</Freccia>
          </Link>
        </div>

        {erroreUltimi ? (
          <p className="text-muted">Non è stato possibile caricare gli ultimi arrivi.</p>
        ) : ultimi === null ? (
          <Caricamento />
        ) : ultimi.length === 0 ? (
          <p className="text-muted">Nessun annuncio pubblicato al momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {ultimi.map((a) => (
              <AutoCard key={a.id} auto={a} />
            ))}
          </div>
        )}
      </section>

      {/* ===== VANTAGGI ===== */}
      <section className="border-y border-line bg-surface/60 py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="kicker mb-2 block">La garanzia di chi sceglie il meglio</span>
            <h2 className="font-display text-3xl font-bold text-ink">Standard d'acquisto ineguagliabili</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {VANTAGGI.map((v) => (
              <div key={v.titolo} className="rounded-lg border border-line bg-surface p-8 transition-colors duration-200 hover:border-gold/40">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-card text-gold">
                  <Icona nome={v.icona} className="text-2xl" />
                </div>
                <h3 className="mb-3 font-display text-xl font-bold text-ink">{v.titolo}</h3>
                <p className="text-xs leading-relaxed text-muted">{v.testo}</p>
                <div className="mt-6 flex items-center gap-2 border-t border-line/60 pt-4 text-[11px] tracking-wider text-gold uppercase">
                  <Icona nome="check_circle" className="text-sm" />
                  <span>{v.nota}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONCIERGE ===== */}
      <section className="border-b border-line bg-bg py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <div>
            <h4 className="font-display text-xl font-bold text-ink">Cerchi un allestimento o una serie limitata specifica?</h4>
            <p className="mt-1 text-xs text-muted">
              Il nostro team Concierge individua e importa il veicolo dei tuoi sogni con certificazione europea.
            </p>
          </div>
          <a
            href="mailto:concierge@saloneauto.it"
            className="inline-flex items-center gap-3 rounded border border-line bg-card px-6 py-3 text-xs font-semibold tracking-wider text-gold uppercase transition-all hover:bg-line"
          >
            <Icona nome="headset_mic" className="text-sm" />
            <span>Parla con un Concierge</span>
          </a>
        </div>
      </section>
    </>
  )
}
