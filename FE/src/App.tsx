import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import Layout from './components/Layout'
import AreaPersonalePage from './pages/account/AreaPersonalePage'
import AdminAutoPage from './pages/admin/AdminAutoPage'
import AdminLayout from './pages/admin/AdminLayout'
import AccediPage from './pages/auth/AccediPage'
import PasswordDimenticataPage from './pages/auth/PasswordDimenticataPage'
import RegistratiPage from './pages/auth/RegistratiPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import CatalogoPage from './pages/CatalogoPage'
import DettaglioAutoPage from './pages/DettaglioAutoPage'
import DisattivaAvvisoPage from './pages/DisattivaAvvisoPage'
import HomePage from './pages/HomePage'
import NonTrovataPage from './pages/NonTrovataPage'

// /auto/:id, /reset-password e /avvisi/disattiva sono i percorsi usati nei link delle mail del backend
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        <Route path="auto/:id" element={<DettaglioAutoPage />} />
        <Route path="avvisi/disattiva" element={<DisattivaAvvisoPage />} />
        <Route path="account" element={<Navigate to="/account/preferiti" replace />} />
        <Route
          path="account/:sezione"
          element={
            <RequireAuth>
              <AreaPersonalePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NonTrovataPage />} />
      </Route>

      <Route path="accedi" element={<AccediPage />} />
      <Route path="registrati" element={<RegistratiPage />} />
      <Route path="password-dimenticata" element={<PasswordDimenticataPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />

      <Route
        path="admin"
        element={
          <RequireAuth admin>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminAutoPage />} />
      </Route>
    </Routes>
  )
}
