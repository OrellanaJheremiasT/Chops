import { Wallet, Package, TriangleAlert, ReceiptText } from 'lucide-react'

const demoStats = [
  { label: 'Ventas', value: 'S/ 1,200.00', icon: Wallet, status: 'is-ok' },
  { label: 'Productos', value: '150', icon: Package, status: '' },
  { label: 'Stock bajo', value: '5', icon: TriangleAlert, status: 'is-warning' },
  { label: 'Operaciones', value: '24', icon: ReceiptText, status: '' },
]

const demoProducts = [
  { name: 'Producto A', status: 'Disponible', statusClass: 'badge-success' },
  { name: 'Producto B', status: 'Stock bajo', statusClass: 'badge-warning' },
]

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="page-title">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen de las operaciones de tu negocio.</p>
        </div>
        <span className="badge badge-info">Datos de prueba</span>
      </div>
      <div className="stat-grid">
        {demoStats.map(stat => {
          const Icon = stat.icon
          return (
            <article key={stat.label} className={`stat ${stat.status}`}>
              <span className="stat-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </article>
          )
        })}
      </div>
      <section className="recent-products" aria-labelledby="recent-products-title">
        <h3 id="recent-products-title">Productos recientes</h3>
        {demoProducts.map(product => (
          <div className="recent-product" key={product.name}>
            <span>{product.name}</span>
            <span className={`badge ${product.statusClass}`}>{product.status}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
