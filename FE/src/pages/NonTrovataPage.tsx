import { Link } from 'react-router-dom'

export default function NonTrovataPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-32 pb-10 text-center">
      <span className="kicker">Errore 404</span>
      <h1 className="mt-4 mb-3 font-display text-5xl font-bold text-ink">Strada sbagliata</h1>
      <p className="mb-8 text-muted">La pagina che cerchi non esiste o è stata spostata.</p>
      <Link to="/" className="btn-oro">
        Torna alla home
      </Link>
    </div>
  )
}
