import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { impostaOnNonAutorizzato, tokenStore } from '../api/client'
import { authApi, profiloApi } from '../api/endpoints'
import type { UtenteResponse } from '../api/types'

interface AuthState {
  utente: UtenteResponse | null
  /** true finché non sappiamo se il token salvato è ancora valido */
  caricamento: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<UtenteResponse>
  logout: () => void
  aggiornaUtente: (u: UtenteResponse) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<UtenteResponse | null>(null)
  const [caricamento, setCaricamento] = useState(() => tokenStore.get() !== null)

  const logout = useCallback(() => {
    tokenStore.clear()
    setUtente(null)
  }, [])

  useEffect(() => {
    impostaOnNonAutorizzato(logout)
    return () => impostaOnNonAutorizzato(null)
  }, [logout])

  // Al primo avvio: se c'è un token salvato, il ruolo e i dati li chiediamo a /api/me
  // (la LoginResponse contiene solo il token).
  useEffect(() => {
    if (!tokenStore.get()) return
    profiloApi
      .leggi()
      .then(setUtente)
      .catch(() => tokenStore.clear())
      .finally(() => setCaricamento(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authApi.login({ email, password })
    tokenStore.set(token)
    try {
      const me = await profiloApi.leggi()
      setUtente(me)
      return me
    } catch (e) {
      tokenStore.clear()
      throw e
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      utente,
      caricamento,
      isAdmin: utente?.ruolo === 'ADMIN',
      login,
      logout,
      aggiornaUtente: setUtente,
    }),
    [utente, caricamento, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth va usato dentro AuthProvider')
  return ctx
}
