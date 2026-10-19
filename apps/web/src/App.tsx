import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutDashboard, Package, MapPin, Boxes, ShoppingCart, ArrowLeftRight, Moon, Sun } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import './App.css'

const sections = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/locations', label: 'Ubicaciones', icon: MapPin },
  { path: '/inventory', label: 'Inventario', icon: Boxes },
  { path: '/checkout', label: 'Ventas', icon: ShoppingCart },
  { path: '/stock-movements', label: 'Movimientos', icon: ArrowLeftRight },
]

function SectionPage({ title }: { title: string }) {
  return (
    <section className="card section-placeholder">
      <h2>{title}</h2>
      <p>Esta sección está en desarrollo.</p>
    </section>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('chops-theme') === 'light' ? 'light' : 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('chops-theme', theme)
  }, [theme])

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand"><h1>CHOPS</h1></div>
        <nav aria-label="Navegación principal">
          {sections.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }>
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="app-header">
          <span className="header-brand">CHOPS</span>
          <button type="button" className="theme-toggle"
            onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            {sections.filter(section =>
              section.path !== '/dashboard' && section.path !== '/products'
            ).map(section => (
              <Route key={section.path} path={section.path}
                element={<SectionPage title={section.label} />} />
            ))}
            <Route path="*" element={<SectionPage title="Página no encontrada" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
