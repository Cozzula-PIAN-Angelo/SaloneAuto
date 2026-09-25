import type { ErroreResponse } from './types'

const CHIAVE_TOKEN = 'salone-auto.token'

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(CHIAVE_TOKEN)
    } catch {
      return null
    }
  },
  set: (token: string) => localStorage.setItem(CHIAVE_TOKEN, token),
  clear: () => localStorage.removeItem(CHIAVE_TOKEN),
}

/** Errore HTTP con il payload ErroreResponse del GlobalExceptionHandler. */
export class ApiError extends Error {
  readonly status: number
  readonly errori: string[]

  constructor(status: number, messaggio: string, errori: string[] = []) {
    super(messaggio)
    this.status = status
    this.errori = errori
  }
}

// Chiamato quando il backend risponde 401 a una richiesta autenticata
// (token scaduto o revocato): l'AuthContext si registra qui per fare logout.
let onNonAutorizzato: (() => void) | null = null
export function impostaOnNonAutorizzato(fn: (() => void) | null) {
  onNonAutorizzato = fn
}

type Query = Record<string, string | number | boolean | undefined | null>

function costruisciUrl(path: string, query?: Query): string {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

interface Opzioni {
  method?: string
  body?: unknown
  query?: Query
}

export async function richiesta<T>(path: string, { method = 'GET', body, query }: Opzioni = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(costruisciUrl(path, query), { method, headers, body: payload })
  } catch {
    throw new ApiError(0, 'Impossibile contattare il server. Riprova tra poco.')
  }

  if (res.status === 204) return undefined as T

  const testo = await res.text()
  let dati: unknown
  try {
    dati = testo ? JSON.parse(testo) : undefined
  } catch {
    // Risposta non JSON (es. pagina d'errore del proxy con backend spento)
    dati = undefined
  }

  if (!res.ok) {
    if (res.status === 401 && token) onNonAutorizzato?.()
    const err = dati as Partial<ErroreResponse> | undefined
    const fallback = res.status >= 500 ? 'Il server non risponde correttamente. Riprova tra poco.' : `Errore ${res.status}`
    throw new ApiError(res.status, err?.messaggio ?? fallback, err?.errori ?? [])
  }
  return dati as T
}

export function messaggioErrore(e: unknown): string {
  if (e instanceof ApiError) return e.message
  return 'Si è verificato un errore imprevisto.'
}
