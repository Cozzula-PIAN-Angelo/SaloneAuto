import { Link } from 'react-router-dom'
import { ETICHETTE_CARBURANTE, ETICHETTE_CONDIZIONE, type AutoResponse } from '../api/types'
import { usePreferiti } from '../preferiti/PreferitiContext'
import { formatKm, formatPrezzo } from '../utils/format'
import { primaImmagine } from '../utils/immagini'
import { sedeMarca } from '../utils/sedi'
import FotoAuto from './FotoAuto'
import Icona from './Icona'

export default function AutoCard({ auto }: { auto: AutoResponse }) {
  const { isPreferito, toggle } = usePreferiti()
  const preferito = isPreferito(auto.id)
  const sede = sedeMarca(auto.marca)

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-gold/50">
      <div className="relative aspect-video w-full overflow-hidden bg-card">
        <Link to={`/auto/${auto.id}`} className="block h-full w-full" tabIndex={-1}>
          <FotoAuto
            immagine={primaImmagine(auto.immagini)}
            alt={auto.titolo}
            className="transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30" />
        </Link>
        <span
          className={`absolute top-3.5 left-3.5 z-10 rounded border border-line bg-bg/90 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md ${
            auto.condizione === 'USATO' ? 'text-ink' : 'text-gold'
          }`}
        >
          {auto.condizione === 'USATO' ? 'Usato certificato' : ETICHETTE_CONDIZIONE[auto.condizione]}
        </span>
        <button
          type="button"
          onClick={() => toggle(auto.id).catch(() => {})}
          aria-label={preferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          aria-pressed={preferito}
          className={`absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg/80 backdrop-blur-md transition-all hover:scale-110 hover:text-gold ${
            preferito ? 'text-gold' : 'text-muted'
          }`}
        >
          <Icona nome="favorite" piena={preferito} className="text-[18px]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {sede && <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted uppercase">{sede}</div>}
          <h3 className="mb-2 font-display text-xl leading-tight font-bold text-ink transition-colors group-hover:text-gold">
            <Link to={`/auto/${auto.id}`}>{auto.titolo}</Link>
          </h3>
          <p className="mb-6 text-[11px] font-medium tracking-wider text-muted uppercase">
            {auto.anno} · {formatKm(auto.chilometraggio)} · {ETICHETTE_CARBURANTE[auto.carburante]}
          </p>
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <span className="block truncate text-[9px] tracking-widest text-muted uppercase">Prezzo chiavi in mano</span>
            <span className="font-display text-xl font-bold whitespace-nowrap text-gold xl:text-2xl">{formatPrezzo(auto.prezzo)}</span>
          </div>
          <Link
            to={`/auto/${auto.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-line px-3 py-1.5 text-xs font-semibold tracking-wider text-ink uppercase transition-colors hover:border-gold/40 hover:text-gold"
          >
            <span>Dettagli</span>
            <Icona nome="arrow_forward" className="text-sm transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
