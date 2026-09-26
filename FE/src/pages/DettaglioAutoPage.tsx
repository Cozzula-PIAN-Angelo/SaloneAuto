import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { autoApi, avvisiApi } from '../api/endpoints'
import { ETICHETTE_CARBURANTE, ETICHETTE_CONDIZIONE, type AutoResponse } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import AlertErrore, { AlertOk } from '../components/AlertErrore'
import AutoCard from '../components/AutoCard'
import Caricamento from '../components/Caricamento'
import FotoAuto from '../components/FotoAuto'
import Icona from '../components/Icona'
import { usePreferiti } from '../preferiti/PreferitiContext'
import { formatData, formatKm, formatPrezzo } from '../utils/format'
import { sedeMarca } from '../utils/sedi'

export default function DettaglioAutoPage() {
  const { id } = useParams()
  const autoId = Number(id)
  const [auto, setAuto] = useState<AutoResponse | null>(null)
  const [errore, setErrore] = useState<unknown>(null)
  const [simili, setSimili] = useState<AutoResponse[]>([])
  const [fotoAttiva, setFotoAttiva] = useState(0)
  const [vinCopiato, setVinCopiato] = useState(false)

  useEffect(() => {
    let annullato = false
    setAuto(null)
    setErrore(null)
    setSimili([])
    setFotoAttiva(0)
    if (!Number.isInteger(autoId) || autoId <= 0) {
      setErrore(new ApiError(404, 'Annuncio non trovato'))
      return
    }
    autoApi
      .dettaglio(autoId)
      .then((a) => {
        if (annullato) return
        setAuto(a)
        window.scrollTo({ top: 0 })
        // "Potrebbero interessarti": stessa marca, escluso l'annuncio corrente.
        // Sezione accessoria: se fallisce semplicemente non compare.
        autoApi
          .cerca({ marca: a.marca, dimensione: 4 })
          .then((p) => !annullato && setSimili(p.contenuto.filter((s) => s.id !== a.id).slice(0, 3)))
          .catch(() => !annullato && setSimili([]))
      })
      .catch((e) => !annullato && setErrore(e))
    return () => {
      annullato = true
    }
  }, [autoId])

  if (errore && !auto) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 px-6 pt-20">
        <h1 className="font-display text-4xl text-ink">Annuncio non disponibile</h1>
        <AlertErrore errore={errore} />
        <Link to="/catalogo" className="btn-linea">
          Torna al catalogo
        </Link>
      </div>
    )
  }
  if (!auto) return <Caricamento />

  const immagini = [...auto.immagini].sort((a, b) => a.ordine - b.ordine)
  const sede = sedeMarca(auto.marca)
  const condizione = auto.condizione === 'USATO' ? 'Usato certificato' : ETICHETTE_CONDIZIONE[auto.condizione]

  const copiaVin = () => {
    if (!auto.vin) return
    navigator.clipboard?.writeText(auto.vin).then(() => {
      setVinCopiato(true)
      setTimeout(() => setVinCopiato(false), 1500)
    })
  }

  const specifiche = [
    { icona: 'calendar_today', label: 'Anno', valore: String(auto.anno), nota: 'Anno modello' },
    { icona: 'speed', label: 'Chilometraggio', valore: formatKm(auto.chilometraggio), nota: 'Certificati' },
    { icona: 'local_gas_station', label: 'Carburante', valore: ETICHETTE_CARBURANTE[auto.carburante], nota: 'Alimentazione' },
    { icona: 'check_circle', label: 'Condizione', valore: condizione, nota: 'Controlli superati' },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">
      <nav aria-label="Percorso" className="mb-8 flex items-center text-xs tracking-wider text-muted uppercase">
        <Link to="/catalogo" className="transition-colors duration-150 hover:text-gold">
          Catalogo
        </Link>
        <span className="mx-2 text-line">/</span>
        <Link to={`/catalogo?marca=${encodeURIComponent(auto.marca)}`} className="transition-colors duration-150 hover:text-gold">
          {auto.marca}
        </Link>
        <span className="mx-2 text-line">/</span>
        <span className="font-medium text-gold">{auto.modello}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-12">
        {/* ===== Colonna sinistra ===== */}
        <section className="flex flex-col gap-8 lg:col-span-7">
          <div className="space-y-4">
            <div className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-surface">
              <FotoAuto
                key={immagini[fotoAttiva]?.id}
                immagine={immagini[fotoAttiva]}
                alt={auto.titolo}
                className="transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 border border-line bg-bg/85 px-2.5 py-1 text-[11px] font-medium tracking-widest text-ink uppercase backdrop-blur-sm">
                  <Icona nome="verified" className="text-xs text-gold" />
                  Certificata {auto.marca}
                </span>
              </div>
              {immagini.length > 0 && (
                <div className="absolute right-4 bottom-4 flex items-center gap-2 border border-line bg-bg/90 px-3 py-1.5 text-xs tracking-wider text-ink uppercase backdrop-blur-sm">
                  <Icona nome="photo_library" className="text-sm text-gold" />
                  {fotoAttiva + 1} / {immagini.length} foto
                </div>
              )}
            </div>
            {immagini.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                {immagini.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setFotoAttiva(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`group relative aspect-video overflow-hidden rounded bg-surface transition-all ${
                      i === fotoAttiva
                        ? 'border-2 border-gold shadow-[0_0_12px_rgba(201,169,110,0.3)]'
                        : 'border border-line opacity-75 hover:border-gold/70 hover:opacity-100'
                    }`}
                  >
                    <FotoAuto immagine={img} alt="" className="transition-transform group-hover:scale-105" />
                    {i === fotoAttiva && <div className="absolute inset-0 bg-gold/10" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-line bg-surface p-6">
            <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-4">
              <h3 className="flex items-center gap-2 font-display text-lg tracking-wide text-ink">
                <span className="inline-block h-1.5 w-1.5 bg-gold" />
                Specifiche Tecniche Principali
              </h3>
              <span className="text-xs tracking-widest text-muted uppercase">Scheda ufficiale</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {specifiche.map((s) => (
                <div key={s.label} className="rounded border border-line/70 bg-card p-4">
                  <div className="mb-1 flex items-center gap-2 text-gold">
                    <Icona nome={s.icona} className="text-lg" />
                    <span className="text-[11px] tracking-widest text-muted uppercase">{s.label}</span>
                  </div>
                  <p className="mt-1 font-display text-xl font-medium text-ink">{s.valore}</p>
                  <span className="text-[10px] tracking-wider text-faint uppercase">{s.nota}</span>
                </div>
              ))}
              <div className="flex flex-col justify-between rounded border border-line/70 bg-card p-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-gold">
                    <Icona nome="pin" className="text-lg" />
                    <span className="text-[11px] tracking-widest text-muted uppercase">Telaio (VIN)</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs tracking-wider text-ink">{auto.vin ?? 'Non indicato'}</p>
                </div>
                {auto.vin && (
                  <button onClick={copiaVin} className="mt-2 flex items-center gap-1 self-start text-[10px] tracking-widest text-gold uppercase hover:underline">
                    <Icona nome={vinCopiato ? 'check' : 'content_copy'} className="text-xs" />
                    {vinCopiato ? 'Copiato' : 'Copia VIN'}
                  </button>
                )}
              </div>
              <div className="rounded border border-line/70 bg-card p-4">
                <div className="mb-1 flex items-center gap-2 text-gold">
                  <Icona nome="event_available" className="text-lg" />
                  <span className="text-[11px] tracking-widest text-muted uppercase">Pubblicato il</span>
                </div>
                <p className="mt-1 font-display text-xl font-medium text-ink">{formatData(auto.dataPubblicazione)}</p>
                <span className="text-[10px] tracking-wider text-faint uppercase">Disponibile in showroom</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-lg border border-line bg-surface p-6 sm:p-8">
            <div className="border-b border-line/60 pb-3">
              <span className="text-xs tracking-widest text-gold uppercase">Dettagli del veicolo</span>
              <h2 className="mt-1 font-display text-2xl text-ink">Descrizione &amp; Allestimento</h2>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{auto.descrizione}</p>
            <div className="grid grid-cols-1 gap-3 border-t border-line/60 pt-4 text-xs sm:grid-cols-2">
              {['Garanzia Salone Auto 24 mesi estendibile', 'Storico verificato sul numero di telaio', 'Controllo tecnico pre-consegna', 'Possibilità di permuta e finanziamento'].map(
                (t) => (
                  <div key={t} className="flex items-center gap-2 text-ink">
                    <Icona nome="done" className="text-sm text-gold" />
                    <span>{t}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ===== Colonna destra ===== */}
        <aside className="lg:col-span-5">
          <div className="sticky top-28 space-y-6">
            <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-6 sm:p-8">
              <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-gold via-gold/50 to-transparent" />
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded border border-gold/40 bg-card px-3 py-1 text-xs font-medium tracking-widest text-gold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {condizione}
                </span>
                <BottoneCondividi titolo={auto.titolo} />
              </div>
              <h1 className="font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">{auto.titolo}</h1>
              <p className="mt-1.5 text-xs tracking-widest text-muted uppercase sm:text-sm">
                {auto.marca} · {auto.modello} · {auto.anno}
              </p>

              <div className="mt-6 border-t border-line/80 pt-5">
                <span className="block text-[11px] tracking-wider text-muted uppercase">Prezzo di vendita showroom</span>
                <span className="mt-1 block font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl">{formatPrezzo(auto.prezzo)}</span>
                <p className="mt-1 text-xs text-faint">IVA inclusa · Passaggio di proprietà escluso</p>
              </div>

              <div className="mt-8">
                <BottonePreferito autoId={auto.id} />
              </div>

              <BoxAvviso auto={auto} />

              <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-5 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Icona nome="location_on" className="text-sm text-gold" />
                  <span>{sede ? `Provenienza: ${sede}` : 'Showroom Milano Centro'}</span>
                </div>
                <a className="text-gold hover:underline" href="tel:+390289004500">
                  +39 02 8900 4500
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-line bg-card p-5">
              <Icona nome="verified_user" className="shrink-0 text-2xl text-gold" />
              <div className="space-y-1 text-xs">
                <h5 className="font-medium tracking-wider text-ink uppercase">Garanzia ufficiale Salone Auto</h5>
                <p className="leading-normal text-muted">
                  Ogni veicolo viene consegnato con perizia tecnica certificata, sanificazione completa e garanzia estesa su parti
                  meccaniche ed elettroniche.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {simili.length > 0 && (
        <section className="mt-20 border-t border-line/80 pt-12">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-1 flex items-center gap-1.5 text-xs tracking-widest text-gold uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Proposte esclusive
              </span>
              <h2 className="font-display text-2xl text-ink sm:text-3xl">Potrebbero Interessarti</h2>
            </div>
            <Link to="/catalogo" className="flex items-center gap-1 self-start text-xs tracking-widest text-gold uppercase hover:underline sm:self-auto">
              <span>Tutto il catalogo</span>
              <Icona nome="arrow_forward" className="text-sm" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {simili.map((a) => (
              <AutoCard key={a.id} auto={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BottoneCondividi({ titolo }: { titolo: string }) {
  const [copiato, setCopiato] = useState(false)
  const condividi = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: titolo, url }).catch(() => {})
    } else {
      await navigator.clipboard?.writeText(url)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 1500)
    }
  }
  return (
    <div className="flex items-center gap-2 text-muted">
      <button onClick={condividi} aria-label="Condividi" className="p-1.5 transition-colors hover:text-gold" title={copiato ? 'Link copiato' : 'Condividi'}>
        <Icona nome={copiato ? 'check' : 'share'} className="text-base" />
      </button>
      <button onClick={() => window.print()} aria-label="Stampa scheda" className="p-1.5 transition-colors hover:text-gold" title="Stampa scheda">
        <Icona nome="print" className="text-base" />
      </button>
    </div>
  )
}

function BottonePreferito({ autoId }: { autoId: number }) {
  const { isPreferito, toggle } = usePreferiti()
  const [inCorso, setInCorso] = useState(false)
  const attivo = isPreferito(autoId)

  const clic = async () => {
    setInCorso(true)
    try {
      await toggle(autoId)
    } catch {
      // stato invariato: il cuore resta com'era
    } finally {
      setInCorso(false)
    }
  }

  return (
    <button
      onClick={clic}
      disabled={inCorso}
      className={`flex w-full items-center justify-center gap-2.5 rounded px-6 py-4 text-xs font-semibold tracking-widest uppercase transition-all duration-200 disabled:opacity-60 ${
        attivo
          ? 'border border-gold/60 text-gold hover:bg-gold/10'
          : 'bg-gold text-bg shadow-[0_4px_20px_rgba(201,169,110,0.25)] hover:bg-gold-hover'
      }`}
    >
      <Icona nome="favorite" piena className="text-lg" />
      <span>{attivo ? 'Nei tuoi preferiti' : 'Aggiungi ai preferiti'}</span>
    </button>
  )
}

function BoxAvviso({ auto }: { auto: AutoResponse }) {
  const { utente } = useAuth()
  const location = useLocation()
  const [errore, setErrore] = useState<unknown>(null)
  const [creato, setCreato] = useState(false)
  const [inCorso, setInCorso] = useState(false)

  const invia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const soglia = Number(new FormData(e.currentTarget).get('soglia'))
    setErrore(null)
    setInCorso(true)
    try {
      await avvisiApi.crea({ autoId: auto.id, soglia })
      setCreato(true)
    } catch (err) {
      setErrore(err)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="mt-7 space-y-3 rounded-lg border border-line/80 bg-card p-4">
      <div className="flex items-center gap-2">
        <Icona nome="notifications_active" className="text-lg text-gold" />
        <h4 className="font-display text-sm font-medium tracking-wide text-ink">Avviso di Prezzo Personalizzato</h4>
      </div>
      <p className="text-xs leading-relaxed text-muted">Ricevi un'email istantanea quando il prezzo scende sotto la tua soglia desiderata.</p>

      {!utente ? (
        <Link
          to="/accedi"
          state={{ da: location.pathname }}
          className="block w-full rounded border border-gold/60 px-4 py-2.5 text-center text-xs tracking-widest text-gold uppercase transition-all duration-200 hover:bg-gold hover:text-bg"
        >
          Accedi per creare un avviso
        </Link>
      ) : creato ? (
        <AlertOk>
          Avviso creato. Lo trovi in{' '}
          <Link to="/account/avvisi" className="underline">
            Avvisi di prezzo
          </Link>
          .
        </AlertOk>
      ) : (
        <form onSubmit={invia} className="space-y-2.5 pt-1">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-muted">€</span>
            <input
              name="soglia"
              type="number"
              required
              min={0.01}
              step={0.01}
              defaultValue={Math.round(auto.prezzo * 0.95)}
              aria-label="Soglia di prezzo"
              className="w-full rounded border border-line bg-bg py-2 pr-3 pl-8 text-xs text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <button
            type="submit"
            disabled={inCorso}
            className="w-full rounded border border-gold/60 px-4 py-2.5 text-xs tracking-widest text-gold uppercase transition-all duration-200 hover:bg-gold hover:text-bg disabled:opacity-50"
          >
            Crea avviso
          </button>
        </form>
      )}
      <AlertErrore errore={errore} />
    </div>
  )
}
