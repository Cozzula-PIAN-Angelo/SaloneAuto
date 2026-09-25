import {
  CARBURANTI,
  CONDIZIONI,
  type Carburante,
  type Condizione,
  type Direzione,
  type OrdinaPer,
  type ParametriCatalogo,
} from '../api/types'

// Filtri del catalogo <-> query string della pagina, così i link sono condivisibili
// e il tasto "indietro" ripristina la ricerca.

const numero = (v: string | null): number | undefined => {
  if (v === null || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const testo = (v: string | null): string | undefined => (v && v.trim() ? v.trim() : undefined)

export const OPZIONI_ORDINAMENTO: { valore: string; etichetta: string; ordinaPer: OrdinaPer; direzione: Direzione }[] = [
  { valore: 'data-desc', etichetta: 'Più recenti', ordinaPer: 'data', direzione: 'desc' },
  { valore: 'prezzo-asc', etichetta: 'Prezzo crescente', ordinaPer: 'prezzo', direzione: 'asc' },
  { valore: 'prezzo-desc', etichetta: 'Prezzo decrescente', ordinaPer: 'prezzo', direzione: 'desc' },
  { valore: 'km-asc', etichetta: 'Chilometraggio', ordinaPer: 'km', direzione: 'asc' },
  { valore: 'anno-desc', etichetta: 'Anno', ordinaPer: 'anno', direzione: 'desc' },
  { valore: 'titolo-asc', etichetta: 'Modello (A-Z)', ordinaPer: 'titolo', direzione: 'asc' },
]

export function leggiParametri(sp: URLSearchParams): ParametriCatalogo {
  const carburante = sp.get('carburante')
  const condizione = sp.get('condizione')
  const ordinamento = OPZIONI_ORDINAMENTO.find((o) => o.valore === sp.get('ordina')) ?? OPZIONI_ORDINAMENTO[0]
  return {
    q: testo(sp.get('q')),
    marca: testo(sp.get('marca')),
    modello: testo(sp.get('modello')),
    carburante: CARBURANTI.includes(carburante as Carburante) ? (carburante as Carburante) : undefined,
    condizione: CONDIZIONI.includes(condizione as Condizione) ? (condizione as Condizione) : undefined,
    prezzoMin: numero(sp.get('prezzoMin')),
    prezzoMax: numero(sp.get('prezzoMax')),
    kmMax: numero(sp.get('kmMax')),
    annoMin: numero(sp.get('annoMin')),
    annoMax: numero(sp.get('annoMax')),
    ordinaPer: ordinamento.ordinaPer,
    direzione: ordinamento.direzione,
    pagina: Math.max(0, (numero(sp.get('pagina')) ?? 1) - 1),
  }
}
