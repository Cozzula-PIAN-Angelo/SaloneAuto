import type { ImmagineResponse } from '../api/types'

/** Prima immagine dell'annuncio secondo `ordine` (il backend non garantisce l'ordinamento della lista). */
export function primaImmagine(immagini: ImmagineResponse[]): ImmagineResponse | undefined {
  return [...immagini].sort((a, b) => a.ordine - b.ordine)[0]
}
