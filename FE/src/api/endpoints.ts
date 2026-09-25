import { richiesta } from './client'
import type {
  AutoRequest,
  AutoResponse,
  AvvisoCreateRequest,
  AvvisoResponse,
  AvvisoUpdateRequest,
  LoginRequest,
  LoginResponse,
  MessaggioResponse,
  PaginaResponse,
  ParametriCatalogo,
  PreferitoResponse,
  ProfiloRequest,
  RegistrazioneRequest,
  StatoAnnuncio,
  UtenteResponse,
  VinDecodificaResponse,
} from './types'

export const authApi = {
  login: (body: LoginRequest) => richiesta<LoginResponse>('/api/auth/login', { method: 'POST', body }),
  registrazione: (body: RegistrazioneRequest) =>
    richiesta<UtenteResponse>('/api/auth/registrazione', { method: 'POST', body }),
  passwordDimenticata: (email: string) =>
    richiesta<MessaggioResponse>('/api/auth/password-dimenticata', { method: 'POST', body: { email } }),
  resetPassword: (token: string, nuovaPassword: string) =>
    richiesta<MessaggioResponse>('/api/auth/reset-password', { method: 'POST', body: { token, nuovaPassword } }),
}

export const profiloApi = {
  leggi: () => richiesta<UtenteResponse>('/api/me'),
  aggiorna: (body: ProfiloRequest) => richiesta<UtenteResponse>('/api/me', { method: 'PUT', body }),
}

export const autoApi = {
  cerca: (p: ParametriCatalogo) => richiesta<PaginaResponse<AutoResponse>>('/api/auto', { query: { ...p } }),
  dettaglio: (id: number) => richiesta<AutoResponse>(`/api/auto/${id}`),
}

export const preferitiApi = {
  elenco: () => richiesta<PreferitoResponse[]>('/api/preferiti'),
  aggiungi: (autoId: number) => richiesta<PreferitoResponse>('/api/preferiti', { method: 'POST', body: { autoId } }),
  rimuovi: (id: number) => richiesta<void>(`/api/preferiti/${id}`, { method: 'DELETE' }),
}

export const avvisiApi = {
  elenco: () => richiesta<AvvisoResponse[]>('/api/avvisi'),
  crea: (body: AvvisoCreateRequest) => richiesta<AvvisoResponse>('/api/avvisi', { method: 'POST', body }),
  aggiorna: (id: number, body: AvvisoUpdateRequest) =>
    richiesta<AvvisoResponse>(`/api/avvisi/${id}`, { method: 'PUT', body }),
  elimina: (id: number) => richiesta<void>(`/api/avvisi/${id}`, { method: 'DELETE' }),
  disattivaConToken: (token: string) =>
    richiesta<MessaggioResponse>('/api/avvisi/disattiva', { method: 'POST', body: { token } }),
}

export const adminAutoApi = {
  elenco: (p: ParametriCatalogo & { stato?: StatoAnnuncio }) =>
    richiesta<PaginaResponse<AutoResponse>>('/api/admin/auto', { query: { ...p } }),
  dettaglio: (id: number) => richiesta<AutoResponse>(`/api/admin/auto/${id}`),
  crea: (body: AutoRequest) => richiesta<AutoResponse>('/api/admin/auto', { method: 'POST', body }),
  aggiorna: (id: number, body: AutoRequest) =>
    richiesta<AutoResponse>(`/api/admin/auto/${id}`, { method: 'PUT', body }),
  aggiornaPrezzo: (id: number, prezzo: number) =>
    richiesta<AutoResponse>(`/api/admin/auto/${id}/prezzo`, { method: 'PATCH', body: { prezzo } }),
  aggiornaStato: (id: number, statoAnnuncio: StatoAnnuncio) =>
    richiesta<AutoResponse>(`/api/admin/auto/${id}/stato`, { method: 'PATCH', body: { statoAnnuncio } }),
  caricaImmagini: (id: number, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return richiesta<AutoResponse>(`/api/admin/auto/${id}/immagini`, { method: 'POST', body: form })
  },
  eliminaImmagine: (id: number, immagineId: number) =>
    richiesta<AutoResponse>(`/api/admin/auto/${id}/immagini/${immagineId}`, { method: 'DELETE' }),
  decodificaVin: (vin: string) => richiesta<VinDecodificaResponse>(`/api/admin/vin/${encodeURIComponent(vin)}`),
}
