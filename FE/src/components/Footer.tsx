import { Link } from 'react-router-dom'
import Icona from './Icona'
import Logo from './Logo'

// Contatti e orari sono quelli del design Stitch (dati dimostrativi).
export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-14 pb-10 md:grid-cols-4 md:px-12">
        <div className="space-y-4">
          <Logo className="text-lg" />
          <p className="text-xs leading-relaxed text-muted">
            Punto di riferimento per collezionisti ed estimatori di automobili d'élite. Ogni modello è sottoposto a
            rigorosi standard di certificazione.
          </p>
          <div className="pt-2 text-[11px] font-semibold tracking-widest text-gold uppercase">Showroom Milano · Roma · Zurigo</div>
        </div>

        <div>
          <h5 className="mb-4 font-display text-sm tracking-widest text-ink uppercase">Contatti Showroom</h5>
          <ul className="space-y-2.5 text-xs text-muted">
            <li className="flex items-start gap-2">
              <Icona nome="location_on" className="mt-0.5 text-base text-gold" />
              <span>Via Monte Napoleone 28, 20121 Milano (MI)</span>
            </li>
            <li className="flex items-center gap-2">
              <Icona nome="call" className="text-base text-gold" />
              <span>Concierge VIP: +39 02 8900 4500</span>
            </li>
            <li className="flex items-center gap-2">
              <Icona nome="mail" className="text-base text-gold" />
              <span>concierge@saloneauto.it</span>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-display text-sm tracking-widest text-ink uppercase">Orari Apertura</h5>
          <ul className="space-y-2 text-xs text-muted">
            <li className="flex justify-between border-b border-line/60 pb-1.5">
              <span>Lunedì — Venerdì</span>
              <span className="text-ink">09:30 - 19:30</span>
            </li>
            <li className="flex justify-between border-b border-line/60 pb-1.5">
              <span>Sabato</span>
              <span className="text-ink">10:00 - 18:30</span>
            </li>
            <li className="flex justify-between pt-1 text-gold">
              <span>Domenica</span>
              <span>Solo su appuntamento</span>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-display text-sm tracking-widest text-ink uppercase">Servizi</h5>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link className="transition-colors duration-150 hover:text-gold" to="/catalogo">
                Catalogo completo
              </Link>
            </li>
            <li>
              <Link className="transition-colors duration-150 hover:text-gold" to="/account/preferiti">
                I tuoi preferiti
              </Link>
            </li>
            <li>
              <Link className="transition-colors duration-150 hover:text-gold" to="/account/avvisi">
                Avvisi di prezzo
              </Link>
            </li>
            <li>
              <Link className="transition-colors duration-150 hover:text-gold" to="/account/profilo">
                Area personale
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 md:flex-row md:px-12">
          <span className="text-center text-xs text-muted md:text-left">
            © {new Date().getFullYear()} Salone Auto. Tutti i diritti riservati. Concessionaria Ufficiale Veicoli Esclusivi.
          </span>
          <span className="flex items-center gap-1.5 text-[11px] tracking-widest text-faint uppercase">
            <Icona nome="verified_user" className="text-sm text-gold/70" />
            Certificazione Storico VIN
          </span>
        </div>
      </div>
    </footer>
  )
}
