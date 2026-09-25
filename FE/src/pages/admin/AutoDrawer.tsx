import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { adminAutoApi } from '../../api/endpoints'
import {
  CARBURANTI,
  CONDIZIONI,
  ETICHETTE_CARBURANTE,
  ETICHETTE_CONDIZIONE,
  type AutoRequest,
  type AutoResponse,
  type Carburante,
  type Condizione,
  type StatoAnnuncio,
  type VinDecodificaResponse,
} from '../../api/types'
import AlertErrore, { AlertOk } from '../../components/AlertErrore'
import FotoAuto from '../../components/FotoAuto'
import Icona from '../../components/Icona'

// Stesso formato di VinFormato.REGEX lato backend: 17 caratteri, senza I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

const campo = 'w-full rounded border border-line bg-well px-3 py-2 text-xs text-ink focus:border-gold focus:outline-none'
const etichetta = 'mb-1 block text-[10px] tracking-wider text-muted uppercase'

interface Bozza {
  titolo: string
  marca: string
  modello: string
  anno: string
  vin: string
  descrizione: string
  chilometraggio: string
  carburante: Carburante
  condizione: Condizione
  prezzo: string
  statoAnnuncio: StatoAnnuncio
}

const bozzaDa = (a: AutoResponse | null): Bozza => ({
  titolo: a?.titolo ?? '',
  marca: a?.marca ?? '',
  modello: a?.modello ?? '',
  anno: a ? String(a.anno) : String(new Date().getFullYear()),
  vin: a?.vin ?? '',
  descrizione: a?.descrizione ?? '',
  chilometraggio: a ? String(a.chilometraggio) : '0',
  carburante: a?.carburante ?? 'BENZINA',
  condizione: a?.condizione ?? 'USATO',
  prezzo: a ? String(a.prezzo) : '',
  statoAnnuncio: a?.statoAnnuncio ?? 'BOZZA',
})

const richiestaDa = (b: Bozza): AutoRequest => ({
  titolo: b.titolo.trim(),
  marca: b.marca.trim(),
  modello: b.modello.trim(),
  anno: Number(b.anno),
  vin: b.vin.trim() ? b.vin.trim().toUpperCase() : null,
  descrizione: b.descrizione.trim(),
  chilometraggio: Number(b.chilometraggio),
  carburante: b.carburante,
  condizione: b.condizione,
  prezzo: Number(b.prezzo),
  statoAnnuncio: b.statoAnnuncio,
})

function Campo({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={etichetta}>{label}</span>
      {children}
    </label>
  )
}

export default function AutoDrawer({
  auto: autoIniziale,
  onChiudi,
  onSalvato,
}: {
  auto: AutoResponse | null
  onChiudi: () => void
  onSalvato: () => void
}) {
  // Dopo la creazione il drawer passa in modalità modifica, così si possono caricare le foto
  const [auto, setAuto] = useState<AutoResponse | null>(autoIniziale)
  const [bozza, setBozza] = useState<Bozza>(() => bozzaDa(autoIniziale))
  const [errore, setErrore] = useState<unknown>(null)
  const [successo, setSuccesso] = useState<string | null>(null)
  const [salvataggio, setSalvataggio] = useState(false)

  const [vinInCorso, setVinInCorso] = useState(false)
  const [vinInfo, setVinInfo] = useState<VinDecodificaResponse | null>(null)
  const [erroreVin, setErroreVin] = useState<unknown>(null)

  const [upload, setUpload] = useState(false)
  const [trascina, setTrascina] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onChiudi()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onChiudi])

  const set = <K extends keyof Bozza>(k: K, v: Bozza[K]) => setBozza((b) => ({ ...b, [k]: v }))

  const vinPulito = bozza.vin.trim().toUpperCase()
  const vinValido = VIN_REGEX.test(vinPulito)

  const decodifica = async () => {
    setErroreVin(null)
    setVinInfo(null)
    setVinInCorso(true)
    try {
      const r = await adminAutoApi.decodificaVin(vinPulito)
      setVinInfo(r)
      // Suggerimenti: riempiono solo i campi che il backend ha saputo dedurre
      setBozza((b) => ({
        ...b,
        vin: r.vin,
        marca: r.marca ?? b.marca,
        modello: r.modello ?? b.modello,
        anno: r.anno ? String(r.anno) : b.anno,
        carburante: r.carburanteSuggerito ?? b.carburante,
        titolo: b.titolo.trim() ? b.titolo : (r.titoloSuggerito ?? b.titolo),
      }))
    } catch (e) {
      setErroreVin(e)
    } finally {
      setVinInCorso(false)
    }
  }

  const salva = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrore(null)
    setSuccesso(null)
    setSalvataggio(true)
    try {
      const body = richiestaDa(bozza)
      const salvato = auto ? await adminAutoApi.aggiorna(auto.id, body) : await adminAutoApi.crea(body)
      setSuccesso(auto ? 'Modifiche salvate.' : 'Annuncio creato. Ora puoi aggiungere le foto.')
      setAuto(salvato)
      setBozza(bozzaDa(salvato))
      onSalvato()
    } catch (err) {
      setErrore(err)
    } finally {
      setSalvataggio(false)
    }
  }

  const carica = async (files: File[]) => {
    if (!auto || files.length === 0) return
    setErrore(null)
    setUpload(true)
    try {
      setAuto(await adminAutoApi.caricaImmagini(auto.id, files))
      onSalvato()
    } catch (err) {
      setErrore(err)
    } finally {
      setUpload(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const eliminaImmagine = async (immagineId: number) => {
    if (!auto) return
    setErrore(null)
    try {
      setAuto(await adminAutoApi.eliminaImmagine(auto.id, immagineId))
      onSalvato()
    } catch (err) {
      setErrore(err)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setTrascina(false)
    carica(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')))
  }

  const immagini = auto ? [...auto.immagini].sort((a, b) => a.ordine - b.ordine) : []

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-titolo"
        className="flex h-screen w-full max-w-[480px] shrink-0 flex-col justify-between border-l border-line bg-surface text-xs shadow-[-10px_0_30px_rgba(0,0,0,0.7)]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 id="drawer-titolo" className="font-display text-lg font-semibold text-ink">
                {auto ? 'Modifica annuncio' : 'Nuovo annuncio'}
              </h2>
              {auto && <span className="rounded border border-line bg-card px-2 py-0.5 font-mono text-[10px] text-gold">#SA-{String(auto.id).padStart(4, '0')}</span>}
            </div>
            <p className="mt-0.5 text-[10px] tracking-wider text-muted uppercase">Gestione scheda veicolo e configurazione</p>
          </div>
          <button
            onClick={onChiudi}
            title="Chiudi pannello"
            className="flex h-8 w-8 items-center justify-center rounded border border-line bg-card text-muted transition-all hover:border-gold/50 hover:text-ink"
          >
            <Icona nome="close" className="text-[18px]" />
          </button>
        </div>

        <form id="form-auto" onSubmit={salva} className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Decodifica VIN */}
          <div className="space-y-3 rounded border border-line bg-well p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted uppercase">
                <Icona nome="qr_code_scanner" className="text-[14px] text-gold" />
                Decodifica VIN / Telaio
              </span>
              <span className="font-mono text-[9px] text-muted">Auto.dev</span>
            </div>
            <div className="flex gap-2">
              <input
                value={bozza.vin}
                onChange={(e) => set('vin', e.target.value.toUpperCase())}
                maxLength={17}
                placeholder="17 caratteri, facoltativo"
                aria-label="VIN"
                className="flex-1 rounded border border-line bg-deep px-3 py-1.5 font-mono text-xs tracking-widest text-ink uppercase focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={decodifica}
                disabled={!vinValido || vinInCorso}
                className="flex items-center gap-1.5 rounded border border-gold/50 bg-card px-3.5 py-1.5 text-[11px] font-medium tracking-wider text-gold uppercase transition-all hover:text-white disabled:opacity-40"
              >
                <Icona nome="sync" className={`text-[15px] ${vinInCorso ? 'animate-spin' : ''}`} />
                Decodifica
              </button>
            </div>
            {bozza.vin && !vinValido && (
              <p className="text-[11px] text-muted">17 caratteri alfanumerici, senza le lettere I, O e Q.</p>
            )}
            {vinInfo?.ambiguo && (
              <div className="flex items-start gap-2.5 rounded-[3px] border border-gold/30 bg-gold/10 p-2.5">
                <Icona nome="info" className="mt-0.5 shrink-0 text-[16px] text-gold" />
                <div className="text-[11px] leading-snug text-gold-soft">
                  <strong className="font-medium">Più allestimenti possibili:</strong> verifica i dati estratti con il libretto prima della
                  pubblicazione.
                </div>
              </div>
            )}
            {vinInfo && (
              <p className="text-[11px] text-muted">
                {[vinInfo.allestimento, vinInfo.motore, vinInfo.carrozzeria, vinInfo.trazione, vinInfo.cambio].filter(Boolean).join(' · ') ||
                  'Nessun dettaglio aggiuntivo.'}
              </p>
            )}
            <AlertErrore errore={erroreVin} />
          </div>

          {/* Dati */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
              <span>Specifiche generali</span>
              <span className="text-[11px] font-normal tracking-normal text-gold normal-case">Tutti i campi sono obbligatori tranne il VIN</span>
            </div>
            <Campo label="Titolo annuncio *">
              <input className={`${campo} font-medium`} required maxLength={150} value={bozza.titolo} onChange={(e) => set('titolo', e.target.value)} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Marca">
                <input className={campo} required maxLength={50} value={bozza.marca} onChange={(e) => set('marca', e.target.value)} />
              </Campo>
              <Campo label="Modello">
                <input className={campo} required maxLength={80} value={bozza.modello} onChange={(e) => set('modello', e.target.value)} />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Anno">
                <input className={`${campo} font-mono`} type="number" required min={1900} max={2100} value={bozza.anno} onChange={(e) => set('anno', e.target.value)} />
              </Campo>
              <Campo label="Chilometraggio">
                <input
                  className={`${campo} font-mono`}
                  type="number"
                  required
                  min={0}
                  max={5_000_000}
                  value={bozza.chilometraggio}
                  onChange={(e) => set('chilometraggio', e.target.value)}
                />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Alimentazione">
                <select className={campo} value={bozza.carburante} onChange={(e) => set('carburante', e.target.value as Carburante)}>
                  {CARBURANTI.map((c) => (
                    <option key={c} value={c}>
                      {ETICHETTE_CARBURANTE[c]}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Condizione">
                <select className={campo} value={bozza.condizione} onChange={(e) => set('condizione', e.target.value as Condizione)}>
                  {CONDIZIONI.map((c) => (
                    <option key={c} value={c}>
                      {ETICHETTE_CONDIZIONE[c]}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Prezzo (€)">
                <input
                  className={`${campo} font-mono text-gold`}
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={bozza.prezzo}
                  onChange={(e) => set('prezzo', e.target.value)}
                />
              </Campo>
              <Campo label="Stato annuncio">
                <select className={campo} value={bozza.statoAnnuncio} onChange={(e) => set('statoAnnuncio', e.target.value as StatoAnnuncio)}>
                  <option value="BOZZA">Bozza</option>
                  <option value="PUBBLICATO">Pubblicato</option>
                </select>
              </Campo>
            </div>
            <Campo label="Descrizione dettagliata">
              <textarea
                className={`${campo} leading-relaxed text-[#D6D4CD]`}
                required
                maxLength={5000}
                rows={5}
                value={bozza.descrizione}
                onChange={(e) => set('descrizione', e.target.value)}
              />
            </Campo>
          </div>

          {/* Immagini */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">Fotografie vettura ({immagini.length})</div>
              <span className="text-[10px] text-muted">JPG, PNG o WebP · max 5 MB</span>
            </div>
            {!auto ? (
              <p className="text-[11px] text-muted">Salva l'annuncio per poter caricare le foto.</p>
            ) : (
              <>
                {immagini.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {immagini.map((img, i) => (
                      <div
                        key={img.id}
                        className={`group relative aspect-[4/3] overflow-hidden rounded-[3px] bg-black ${i === 0 ? 'border-2 border-gold' : 'border border-line'}`}
                      >
                        <FotoAuto immagine={img} alt="" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 rounded-[2px] bg-gold px-1 text-[8px] font-semibold text-black uppercase">Copertina</span>
                        )}
                        <button
                          type="button"
                          onClick={() => eliminaImmagine(img.id)}
                          aria-label="Elimina foto"
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-950 focus:opacity-100"
                        >
                          <Icona nome="close" className="text-[12px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInput.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setTrascina(true)
                  }}
                  onDragLeave={() => setTrascina(false)}
                  onDrop={onDrop}
                  className={`group cursor-pointer rounded border border-dashed p-5 text-center transition-colors ${
                    trascina ? 'border-gold bg-gold/10' : 'border-line-strong bg-deep/60 hover:border-gold'
                  }`}
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted transition-colors group-hover:bg-gold/20 group-hover:text-gold">
                    <Icona nome="cloud_upload" className={`text-[18px] ${upload ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-[11px] font-medium text-ink">{upload ? 'Caricamento in corso…' : 'Trascina qui le foto o clicca per caricare'}</div>
                  <div className="mt-0.5 text-[9px] text-muted">Formati ammessi: JPG, PNG, WebP</div>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => carica(Array.from(e.target.files ?? []))}
                />
              </>
            )}
          </div>

          {successo && <AlertOk>{successo}</AlertOk>}
          <AlertErrore errore={errore} />
        </form>

        <div className="flex h-16 shrink-0 items-center justify-between border-t border-line bg-surface px-6">
          <button
            type="button"
            onClick={onChiudi}
            className="rounded border border-line px-4 py-2 text-xs font-medium tracking-wider text-muted uppercase transition-colors hover:bg-card hover:text-ink"
          >
            Chiudi
          </button>
          <div className="flex items-center gap-2.5">
            {auto?.statoAnnuncio === 'PUBBLICATO' && (
              <Link
                to={`/auto/${auto.id}`}
                target="_blank"
                className="rounded border border-line bg-well px-3 py-2 text-xs tracking-wider text-muted uppercase transition-colors hover:text-ink"
              >
                Anteprima
              </Link>
            )}
            <button
              type="submit"
              form="form-auto"
              disabled={salvataggio}
              className="flex items-center gap-1.5 rounded bg-gold px-5 py-2 text-xs font-bold tracking-wider text-bg uppercase shadow-[0_2px_14px_rgba(201,169,110,0.3)] transition-all hover:bg-gold-hover disabled:opacity-50"
            >
              <Icona nome="check" className="text-[17px] font-semibold" />
              {salvataggio ? 'Salvataggio…' : auto ? 'Salva modifiche' : 'Crea annuncio'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
