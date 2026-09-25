import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ETICHETTE_CARBURANTE } from '../../api/types'
import AlertErrore from '../../components/AlertErrore'
import Caricamento from '../../components/Caricamento'
import FotoAuto from '../../components/FotoAuto'
import Icona from '../../components/Icona'
import { usePreferiti } from '../../preferiti/PreferitiContext'
import { formatData, formatKm, formatPrezzo } from '../../utils/format'
import { primaImmagine } from '../../utils/immagini'
import { sedeMarca } from '../../utils/sedi'

type Ordine = 'prezzo-desc' | 'prezzo-asc' | 'recenti' | 'km'

export default function SezionePreferiti() {
  const { preferiti, caricamento, rimuovi } = usePreferiti()
  const [errore, setErrore] = useState<unknown>(null)
  const [ordine, setOrdine] = useState<Ordine>('recenti')

  const ordinati = useMemo(() => {
    const lista = [...preferiti]
    if (ordine === 'prezzo-desc') lista.sort((a, b) => b.auto.prezzo - a.auto.prezzo)
    if (ordine === 'prezzo-asc') lista.sort((a, b) => a.auto.prezzo - b.auto.prezzo)
    if (ordine === 'km') lista.sort((a, b) => a.auto.chilometraggio - b.auto.chilometraggio)
    if (ordine === 'recenti') lista.sort((a, b) => b.dataAggiunta.localeCompare(a.dataAggiunta))
    return lista
  }, [preferiti, ordine])

  const elimina = async (id: number) => {
    setErrore(null)
    try {
      await rimuovi(id)
    } catch (e) {
      setErrore(e)
    }
  }

  return (
    <div id="sezione-preferiti" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-3 font-display text-2xl font-normal text-ink">
            <span>Vetture Salvate</span>
            <span className="rounded-full border border-line bg-card px-2.5 py-0.5 font-sans text-xs font-light text-gold">
              {preferiti.length} {preferiti.length === 1 ? 'modello' : 'modelli'}
            </span>
          </h2>
          <p className="mt-1 text-xs font-light text-muted">Disponibilità immediata presso gli showroom ufficiali.</p>
        </div>
        {preferiti.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="ordina-pref" className="text-xs tracking-wider text-muted uppercase">
              Ordina per:
            </label>
            <select
              id="ordina-pref"
              value={ordine}
              onChange={(e) => setOrdine(e.target.value as Ordine)}
              className="rounded border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-gold focus:ring-0 focus:outline-none"
            >
              <option value="recenti">Aggiunti di recente</option>
              <option value="prezzo-desc">Prezzo: decrescente</option>
              <option value="prezzo-asc">Prezzo: crescente</option>
              <option value="km">Chilometraggio minore</option>
            </select>
          </div>
        )}
      </div>

      <AlertErrore errore={errore} />

      {caricamento ? (
        <Caricamento />
      ) : preferiti.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-line-strong p-10">
          <Icona nome="favorite" className="text-3xl text-gold" />
          <h3 className="font-display text-xl text-ink">Nessuna auto salvata</h3>
          <p className="text-sm text-muted">Tocca il cuore su un annuncio per ritrovarlo qui.</p>
          <Link to="/catalogo" className="btn-oro">
            Esplora il catalogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {ordinati.map(({ id, auto, dataAggiunta }) => {
            const sede = sedeMarca(auto.marca)
            return (
              <div
                key={id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:border-gold/60"
              >
                <div>
                  <div className="relative h-60 w-full overflow-hidden bg-black">
                    <Link to={`/auto/${auto.id}`} tabIndex={-1}>
                      <FotoAuto
                        immagine={primaImmagine(auto.immagini)}
                        alt={auto.titolo}
                        className="brightness-95 contrast-105 transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </Link>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded border border-gold/40 bg-bg/80 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-gold uppercase backdrop-blur-md">
                        {auto.marca} Approved
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => elimina(id)}
                      title="Rimuovi dai preferiti"
                      aria-label={`Rimuovi ${auto.titolo} dai preferiti`}
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg/80 text-muted backdrop-blur-md transition hover:border-red-400 hover:text-red-400"
                    >
                      <Icona nome="delete" className="text-base" />
                    </button>
                    <div className="pointer-events-none absolute right-4 bottom-3 left-4 flex items-center justify-between">
                      <span className="text-[11px] tracking-wider text-muted">Aggiunto il {formatData(dataAggiunta)}</span>
                      {sede && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gold">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                          {sede.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-1 font-display text-lg text-ink transition-colors group-hover:text-gold">{auto.titolo}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {auto.marca} · {auto.modello}
                    </p>
                    <div className="my-4 grid grid-cols-3 gap-2 border-y border-line/80 py-3 text-center">
                      <div>
                        <span className="block text-[10px] tracking-widest text-muted uppercase">Anno</span>
                        <span className="text-xs font-semibold text-ink">{auto.anno}</span>
                      </div>
                      <div className="border-x border-line/60">
                        <span className="block text-[10px] tracking-widest text-muted uppercase">Km</span>
                        <span className="text-xs font-semibold text-ink">{formatKm(auto.chilometraggio)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] tracking-widest text-muted uppercase">Alimentazione</span>
                        <span className="text-xs font-semibold text-ink">{ETICHETTE_CARBURANTE[auto.carburante]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line/40 px-5 pt-1 pb-5">
                  <div>
                    <span className="block text-[10px] tracking-widest text-muted uppercase">Prezzo listino</span>
                    <span className="font-display text-xl font-semibold text-gold">{formatPrezzo(auto.prezzo)}</span>
                  </div>
                  <Link
                    to={`/auto/${auto.id}`}
                    className="rounded border border-gold px-4 py-2 text-xs font-medium tracking-wider text-gold uppercase transition-all duration-200 hover:bg-gold hover:text-bg"
                  >
                    Vedi dettagli
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
