import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icona from '../../components/Icona'

/** Layout split delle pagine di accesso (design Stitch "Accedi"/"Registrati"): foto a sinistra, form a destra. */
export default function AuthLayout({
  immagine = '/img/accedi.jpg',
  lato,
  children,
}: {
  immagine?: string
  lato: ReactNode
  children: ReactNode
}) {
  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row">
      <section className="relative flex min-h-[460px] w-full flex-col justify-between overflow-hidden p-8 sm:p-12 lg:min-h-screen lg:w-1/2 lg:p-16">
        <img
          src={immagine}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.78] contrast-[1.08] transition-transform duration-1000 ease-out hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent opacity-95" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-bg/85 via-transparent to-bg opacity-90 lg:block" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,169,110,0.1),transparent_60%)]" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3.5 transition-transform duration-200 active:scale-95">
            <span className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-line bg-surface text-gold shadow-sm transition-colors group-hover:border-gold/60">
              <span className="font-display text-base font-bold tracking-tighter">S</span>
            </span>
            <span className="font-display text-xl font-bold tracking-widest text-ink transition-colors group-hover:text-gold">SALONE AUTO</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[2px] border border-line/60 bg-bg/40 px-3 py-1.5 text-xs tracking-wider text-muted uppercase backdrop-blur-md transition-colors duration-150 hover:border-gold/50 hover:text-gold"
          >
            <Icona nome="arrow_back" className="text-[15px]" />
            <span>Torna al sito</span>
          </Link>
        </div>

        <div className="relative z-10 mt-auto max-w-xl pt-16 lg:pt-0">{lato}</div>
      </section>

      <section className="relative z-10 flex w-full items-center justify-center border-t border-line/40 bg-bg p-6 sm:p-10 lg:w-1/2 lg:border-t-0 lg:border-l lg:p-14">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-card opacity-40 blur-2xl" />
        <div className="relative mx-auto w-full max-w-[420px] py-8">{children}</div>
      </section>
    </main>
  )
}

/** Intestazione del form: badge, titolo e sottotitolo. */
export function TestaForm({ badge, titolo, sottotitolo }: { badge: string; titolo: string; sottotitolo: string }) {
  return (
    <div className="mb-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-line bg-surface px-2.5 py-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        <span className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">{badge}</span>
      </div>
      <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{titolo}</h1>
      <p className="text-sm leading-relaxed font-light text-muted">{sottotitolo}</p>
    </div>
  )
}

/** Citazione in basso a sinistra (pagine senza elenco di vantaggi). */
export function Citazione({ etichetta, testo }: { etichetta: string; testo: string }) {
  return (
    <>
      <div className="mb-3 inline-flex items-center gap-2">
        <span className="h-px w-6 bg-gold" />
        <span className="text-[10px] font-medium tracking-[0.25em] text-gold uppercase">{etichetta}</span>
      </div>
      <blockquote className="font-display text-2xl leading-tight font-normal text-ink italic drop-shadow-sm sm:text-3xl lg:text-[34px]">
        «{testo}»
      </blockquote>
      <div className="mt-4 flex items-center gap-4 text-xs tracking-wider text-muted">
        <p className="font-light tracking-widest text-muted/90 uppercase">Collezione esclusiva Salone Auto</p>
        <span className="text-line">•</span>
        <span className="text-[11px] text-gold/80">Milano · Cortina</span>
      </div>
    </>
  )
}

export const inputAuth =
  'w-full rounded border border-line bg-surface px-3.5 py-3 text-sm text-ink transition-all duration-150 placeholder:text-faint hover:border-line-strong focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none'
export const labelAuth = 'block text-xs font-medium tracking-wider text-muted uppercase'
export const linkOro = 'font-medium text-gold transition-colors hover:text-gold-hover hover:underline'
