
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const sections = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/products', label: 'Products' },
  { path: '/locations', label: 'Locations' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/stock-movements', label: 'Stock Movements' },
]

function SectionPage({ title }: { title: string }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>This section is under development.</p>
    </section>
  )
}

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>StockFlow</h1>

        <nav aria-label="Main navigation">
          {sections.map((section) => (
            <NavLink
              key={section.path}
              to={section.path}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="app-header">
          <span>StockFlow Management</span>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {sections.map((section) => (
              <Route
                key={section.path}
                path={section.path}
                element={<SectionPage title={section.label} />}
              />
            ))}
            <Route path="*" element={<SectionPage title="Page not found" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
