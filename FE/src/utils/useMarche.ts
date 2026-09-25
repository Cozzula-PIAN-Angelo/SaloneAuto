import { useEffect, useState } from 'react'
import { autoApi } from '../api/endpoints'

// Il backend non ha un endpoint delle marche e il filtro `marca` è per nome esatto:
// le marche si ricavano dal catalogo pubblicato (poche pagine da 50, poi in cache).
let cache: Promise<string[]> | null = null

async function caricaMarche(): Promise<string[]> {
  const marche = new Set<string>()
  for (let pagina = 0; pagina < 6; pagina++) {
    const p = await autoApi.cerca({ pagina, dimensione: 50, ordinaPer: 'titolo', direzione: 'asc' })
    p.contenuto.forEach((a) => marche.add(a.marca))
    if (pagina >= p.totalePagine - 1) break
  }
  return [...marche].sort((a, b) => a.localeCompare(b, 'it'))
}

export function useMarche(): string[] {
  const [marche, setMarche] = useState<string[]>([])
  useEffect(() => {
    cache ??= caricaMarche().catch(() => {
      cache = null
      return []
    })
    let attivo = true
    cache.then((m) => attivo && setMarche(m))
    return () => {
      attivo = false
    }
  }, [])
  return marche
}
