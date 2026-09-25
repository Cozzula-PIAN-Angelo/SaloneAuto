// Tipi ricalcati sui DTO del backend (package it.epicode.saloneauto.payloads).
// BigDecimal arriva come number, LocalDateTime come stringa ISO.

export type Carburante = 'BENZINA' | 'DIESEL' | 'GPL' | 'METANO' | 'IBRIDA' | 'ELETTRICA'
export type Condizione = 'NUOVO' | 'KM_0' | 'USATO'
export type StatoAnnuncio = 'BOZZA' | 'PUBBLICATO'
export type Ruolo = 'USER' | 'ADMIN'

export const CARBURANTI: Carburante[] = ['BENZINA', 'DIESEL', 'GPL', 'METANO', 'IBRIDA', 'ELETTRICA']
export const CONDIZIONI: Condizione[] = ['NUOVO', 'KM_0', 'USATO']

export const ETICHETTE_CARBURANTE: Record<Carburante, string> = {
  BENZINA: 'Benzina',
  DIESEL: 'Diesel',
  GPL: 'GPL',
  METANO: 'Metano',
  IBRIDA: 'Ibrida',
  ELETTRICA: 'Elettrica',
}

export const ETICHETTE_CONDIZIONE: Record<Condizione, string> = {
  NUOVO: 'Nuovo',
  KM_0: 'Km 0',
  USATO: 'Usato',
}

export interface ImmagineResponse {
  id: number
  url: string
  ordine: number
}

export interface AutoResponse {
  id: number
  titolo: string
  marca: string
  modello: string
  anno: number
  vin: string | null
  descrizione: string
  chilometraggio: number
  carburante: Carburante
  condizione: Condizione
  prezzo: number
  statoAnnuncio: StatoAnnuncio
  dataCreazione: string
  dataPubblicazione: string | null
  immagini: ImmagineResponse[]
}

export interface AutoRequest {
  titolo: string
  marca: string
  modello: string
  anno: number
  vin: string | null
  descrizione: string
  chilometraggio: number
  carburante: Carburante
  condizione: Condizione
  prezzo: number
  statoAnnuncio: StatoAnnuncio
}

export interface PaginaResponse<T> {
  contenuto: T[]
  pagina: number
  dimensione: number
  totaleElementi: number
  totalePagine: number
}

export interface FiltriRicerca {
  q?: string
  marca?: string
  modello?: string
  carburante?: Carburante
  condizione?: Condizione
  prezzoMin?: number
  prezzoMax?: number
  kmMax?: number
  annoMin?: number
  annoMax?: number
}

// Valori ammessi da CampoOrdinamento lato backend
export type OrdinaPer = 'prezzo' | 'km' | 'data' | 'titolo' | 'anno'
export type Direzione = 'asc' | 'desc'

export interface ParametriCatalogo extends FiltriRicerca {
  ordinaPer?: OrdinaPer
  direzione?: Direzione
  pagina?: number
  dimensione?: number
}

export interface UtenteResponse {
  id: number
  nome: string
  cognome: string
  email: string
  ruolo: Ruolo
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RegistrazioneRequest {
  nome: string
  cognome: string
  email: string
  password: string
}

export interface ProfiloRequest {
  nome: string
  cognome: string
}

export interface PreferitoResponse {
  id: number
  auto: AutoResponse
  dataAggiunta: string
}

export interface AvvisoResponse {
  id: number
  autoId: number
  titoloAuto: string
  prezzoAttuale: number
  soglia: number
  attivo: boolean
  dataCreazione: string
  ultimaNotifica: string | null
}

export interface AvvisoCreateRequest {
  autoId: number
  soglia: number
}

export interface AvvisoUpdateRequest {
  soglia: number
  attivo: boolean
}

export interface VinDecodificaResponse {
  vin: string
  marca: string | null
  modello: string | null
  anno: number | null
  allestimento: string | null
  motore: string | null
  carrozzeria: string | null
  trazione: string | null
  cambio: string | null
  carburanteSuggerito: Carburante | null
  titoloSuggerito: string | null
  ambiguo: boolean
}

export interface MessaggioResponse {
  messaggio: string
}

export interface ErroreResponse {
  timestamp: string
  status: number
  messaggio: string
  errori: string[]
}
