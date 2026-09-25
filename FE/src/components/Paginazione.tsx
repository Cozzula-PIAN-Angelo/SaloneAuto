import Icona from './Icona'

const base = 'flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 text-xs transition-colors'
const normale = `${base} border-line bg-surface text-muted hover:border-gold hover:text-ink disabled:pointer-events-none disabled:opacity-35`
const attiva = `${base} border-gold bg-gold font-bold text-bg shadow-sm`

/** Pagine 0-based come nel backend; mostrate all'utente da 1. */
export default function Paginazione({
  pagina,
  totalePagine,
  onCambia,
}: {
  pagina: number
  totalePagine: number
  onCambia: (p: number) => void
}) {
  if (totalePagine <= 1) return null

  const voci: (number | '…')[] = []
  for (let i = 0; i < totalePagine; i++) {
    if (i === 0 || i === totalePagine - 1 || Math.abs(i - pagina) <= 1) voci.push(i)
    else if (voci[voci.length - 1] !== '…') voci.push('…')
  }

  return (
    <nav aria-label="Paginazione" className="flex items-center justify-center gap-2 border-t border-line pt-8">
      <button className={normale} disabled={pagina === 0} onClick={() => onCambia(pagina - 1)} aria-label="Pagina precedente">
        <Icona nome="chevron_left" className="text-base" />
      </button>
      {voci.map((v, i) =>
        v === '…' ? (
          <span key={`e${i}`} className="flex h-9 w-8 items-center justify-center text-xs tracking-widest text-muted">
            …
          </span>
        ) : (
          <button
            key={v}
            className={v === pagina ? attiva : normale}
            onClick={() => onCambia(v)}
            aria-current={v === pagina ? 'page' : undefined}
          >
            {v + 1}
          </button>
        ),
      )}
      <button
        className={normale}
        disabled={pagina >= totalePagine - 1}
        onClick={() => onCambia(pagina + 1)}
        aria-label="Pagina successiva"
      >
        <Icona nome="chevron_right" className="text-base" />
      </button>
    </nav>
  )
}
