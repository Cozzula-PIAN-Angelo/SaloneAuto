import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Caricamento from '../components/Caricamento'

/** Protegge una route: senza login rimanda a /accedi, con `admin` richiede il ruolo ADMIN. */
export default function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { utente, caricamento, isAdmin } = useAuth()
  const location = useLocation()

  if (caricamento) return <Caricamento />
  if (!utente) return <Navigate to="/accedi" replace state={{ da: location.pathname + location.search }} />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
