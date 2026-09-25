import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { preferitiApi } from '../api/endpoints'
import type { PreferitoResponse } from '../api/types'
import { useAuth } from '../auth/AuthContext'

interface PreferitiState {
  preferiti: PreferitoResponse[]
  caricamento: boolean
  isPreferito: (autoId: number) => boolean
  /** Aggiunge o rimuove; senza login porta alla pagina di accesso. */
  toggle: (autoId: number) => Promise<void>
  rimuovi: (preferitoId: number) => Promise<void>
}

const PreferitiContext = createContext<PreferitiState | null>(null)

export function PreferitiProvider({ children }: { children: ReactNode }) {
  const { utente } = useAuth()
  const navigate = useNavigate()
  const [preferiti, setPreferiti] = useState<PreferitoResponse[]>([])
  const [caricamento, setCaricamento] = useState(false)

  useEffect(() => {
    if (!utente) {
      setPreferiti([])
      return
    }
    setCaricamento(true)
    preferitiApi
      .elenco()
      .then(setPreferiti)
      .catch(() => setPreferiti([]))
      .finally(() => setCaricamento(false))
  }, [utente])

  const perAuto = useMemo(() => new Map(preferiti.map((p) => [p.auto.id, p])), [preferiti])

  const rimuovi = useCallback(async (preferitoId: number) => {
    await preferitiApi.rimuovi(preferitoId)
    setPreferiti((prev) => prev.filter((p) => p.id !== preferitoId))
  }, [])

  const toggle = useCallback(
    async (autoId: number) => {
      if (!utente) {
        navigate('/accedi', { state: { da: window.location.pathname + window.location.search } })
        return
      }
      const esistente = perAuto.get(autoId)
      if (esistente) {
        await rimuovi(esistente.id)
      } else {
        const nuovo = await preferitiApi.aggiungi(autoId)
        setPreferiti((prev) => [nuovo, ...prev])
      }
    },
    [utente, perAuto, rimuovi, navigate],
  )

  const value = useMemo<PreferitiState>(
    () => ({ preferiti, caricamento, isPreferito: (id) => perAuto.has(id), toggle, rimuovi }),
    [preferiti, caricamento, perAuto, toggle, rimuovi],
  )

  return <PreferitiContext.Provider value={value}>{children}</PreferitiContext.Provider>
}

export function usePreferiti(): PreferitiState {
  const ctx = useContext(PreferitiContext)
  if (!ctx) throw new Error('usePreferiti va usato dentro PreferitiProvider')
  return ctx
}
