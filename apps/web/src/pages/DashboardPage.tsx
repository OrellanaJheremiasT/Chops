import { useLanguage } from "../i18n/LanguageContext";
import { Wallet, Package, TriangleAlert, ReceiptText } from 'lucide-react'

const demoStats = [
  { label: 'Sales', value: 'S/ 1,200.00', icon: Wallet, status: 'is-ok' },
  { label: 'Products', value: '150', icon: Package, status: '' },
  { label: 'Low Stock', value: '5', icon: TriangleAlert, status: 'is-warning' },
  { label: 'Transactions', value: '24', icon: ReceiptText, status: '' },
]

const demoProducts = [
  { name: 'Product A', status: 'Available', statusClass: 'badge-success' },
  { name: 'Product B', status: 'Low Stock', statusClass: 'badge-warning' },
]

export default function DashboardPage() {
  const { t } = useLanguage();
  return (
    <div className="dashboard-page">
      <div className="page-title">
        <div>
          <h2>{t('Dashboard')}</h2>
          <p>{t('Overview of your business operations.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </div>
      <div className="stat-grid">
        {demoStats.map(stat => {
          const Icon = stat.icon
          return (
            <article key={stat.label} className={`stat ${stat.status}`}>
              <span className="stat-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <div className="stat-label">{t(stat.label)}</div>
              <div className="stat-value">{stat.value}</div>
            </article>
          )
        })}
      </div>
      <section className="recent-products" aria-labelledby="recent-products-title">
        <h3 id="recent-products-title">{t('Recent Products')}</h3>
        {demoProducts.map(product => (
          <div className="recent-product" key={product.name}>
            <span>{product.name}</span>
            <span className={`badge ${product.statusClass}`}>{t(product.status)}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
