import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute.jsx'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicRoute from './components/PublicRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AdminHomePage from './pages/AdminHomePage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ItemsPage from './pages/ItemsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotAuthorizedPage from './pages/NotAuthorizedPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SuppliersPage from './pages/SuppliersPage.jsx'
import StockRequestsPage from './pages/StockRequestsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route element={<PublicRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="stock-requests" element={<StockRequestsPage />} />
              <Route path="admin" element={<AdminRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="overview" element={<AdminHomePage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
              <Route path="not-authorized" element={<NotAuthorizedPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
