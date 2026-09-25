import type { ReactNode } from 'react'
import { ApiError } from '../api/client'
import Icona from './Icona'

/** Mostra un errore API: messaggio + eventuale elenco `errori` di validazione del backend. */
export default function AlertErrore({ errore }: { errore: unknown }) {
  if (!errore) return null
  const messaggio = errore instanceof ApiError ? errore.message : 'Si è verificato un errore imprevisto.'
  const dettagli = errore instanceof ApiError ? errore.errori : []
  return (
    <div className="flex items-start gap-2.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#FCA5A5]" role="alert">
      <Icona nome="error" className="mt-0.5 shrink-0 text-base text-[#EF4444]" />
      <div className="leading-relaxed">
        {messaggio}
        {dettagli.length > 0 && (
          <ul className="mt-1.5 list-disc pl-4">
            {dettagli.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function AlertOk({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded border border-emerald-800/40 bg-emerald-950/40 p-3 text-xs text-emerald-300" role="status">
      <Icona nome="check_circle" className="mt-0.5 shrink-0 text-base text-emerald-400" />
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}
