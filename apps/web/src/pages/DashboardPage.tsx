import { useState } from 'react'
import { Wallet, Package, TriangleAlert, ReceiptText, BarChart3, TrendingDown } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import ChopsSelect from '../components/ChopsSelect'
import StackedBars from '../components/StackedBars'
import { useOperations } from '../demo/OperationsContext'
import '../styles/dashboard-enhancements.css'
const sampleSales = [750, 920, 850, 1100, 1430, 1750, 1200]
const sampleSellers = [{ sku: 'BEV-COKE-500', qty: 57 }, { sku: 'SNK-CHIPS-45', qty: 41 }, { sku: 'DAI-MILK-1L', qty: 25 }]
export default function DashboardPage() {
  const { t } = useLanguage();
  const { items, balances, operations } = useOperations()
  const [range, setRange] = useState('7');
  const [branch, setBranch] = useState('main')
  const totalUnits = items.reduce((s, i) => s + balances[i.sku].exhibition + balances[i.sku].warehouse, 0)
  const low = items.filter(i => {
    const sum = balances[i.sku].exhibition + balances[i.sku].warehouse;
    return sum > 0 && sum <= 5
  }).length
  const loss = operations.filter(o => o.kind === 'loss')
  const unexplained = operations.filter(o => o.kind === 'count' && (o.counted ?? 0) < (o.previous ?? 0))
  const lossUnits = loss.reduce((s, o) => s + o.quantity, 0)
  const shrinkUnits = unexplained.reduce((s, o) => s + o.quantity, 0)
  const theft = loss.filter(o => o.reason.startsWith('Confirmed Theft')).reduce((s, o) => s + o.quantity, 0)
  const bySku = [...items]
    .map(i => ({
      item: i,
      qty: loss
        .filter(o => o.sku === i.sku)
        .reduce((sum, o) => sum + o.quantity, 0),
    }))
    .sort((a, b) => b.qty - a.qty)
  const maxSale = Math.max(...sampleSales)
  return (
    <section className="dashboard-page dashboard-v2">
      <div className="page-title">
        <div>
          <h2>{t('Dashboard')}</h2>
          <p>{t('Store performance, sales and inventory exceptions.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </div>
      <div className="dash-filters">
        <div className="dash-filter">
          <label htmlFor="dash-period">{t('Period')}</label>
          <ChopsSelect
            id="dash-period"
            ariaLabel={t('Period')}
            value={range}
            options={[
              { value: '7', label: t('Last 7 days') },
              { value: '30', label: t('Last 30 days') },
            ]}
            onChange={setRange}
          />
        </div>
        <div className="dash-filter">
          <label htmlFor="dash-branch">{t('Branch')}</label>
          <ChopsSelect
            id="dash-branch"
            ariaLabel={t('Branch')}
            value={branch}
            options={[{ value: 'main', label: 'Main Store' }]}
            onChange={setBranch}
          />
        </div>
      </div>
      <div className="dash-kpis">
        <article className="stat">
          <Wallet className="stat-icon" size={18} />
          <div className="stat-label">{t('Sales')} ({t('Sample')})</div>
          <div className="stat-value">S/ {range === '7' ? '8,000.00' : '34,800.00'}</div>
        </article>
        <article className="stat">
          <ReceiptText className="stat-icon" size={18} />
          <div className="stat-label">{t('Transactions')} ({t('Sample')})</div>
          <div className="stat-value">{range === '7' ? 124 : 508}</div>
        </article>
        <article className="stat">
          <Package className="stat-icon" size={18} />
          <div className="stat-label">{t('Total units')}</div>
          <div className="stat-value">{totalUnits}</div>
        </article>
        <article className="stat">
          <TriangleAlert className="stat-icon" size={18} />
          <div className="stat-label">{t('Low-stock SKUs')}</div>
          <div className="stat-value">{low}</div>
        </article>
        <article className="stat">
          <TrendingDown className="stat-icon" size={18} />
          <div className="stat-label">{t('Reported loss units')}</div>
          <div className="stat-value">{lossUnits}</div>
        </article>
        <article className="stat">
          <TriangleAlert className="stat-icon" size={18} />
          <div className="stat-label">{t('Unexplained shortages')}</div>
          <div className="stat-value">{shrinkUnits}</div>
        </article>
        <article className="stat">
          <TriangleAlert className="stat-icon" size={18} />
          <div className="stat-label">{t('Confirmed theft units')}</div>
          <div className="stat-value">{theft}</div>
        </article>
        <article className="stat">
          <BarChart3 className="stat-icon" size={18} />
          <div className="stat-label">{t('Operations logged')}</div>
          <div className="stat-value">{operations.length}</div>
        </article>
      </div>
      <StackedBars operations={operations} days={Number(range)} />
      <div className="dash-panels">
        <section className="dash-panel">
          <h3>{t('Sales trend')} <small>({t('Sample')})</small>
          </h3>
          <div className="dash-bars">{sampleSales.map((sale, index) => (
            <div className="dash-bar-col" key={index}>
              <span>S/ {sale}</span>
              <div style={{ height: `${Math.round(sale / maxSale * 150)}px` }} />
              <small>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</small>
            </div>
          ))}</div>
          <p className="ops-footnote">{t('Illustrative sales: not connected to Checkout yet.')}</p>
        </section>
        <section className="dash-panel">
          <h3>{t('Best Sellers')} <small>({t('Sample')})</small>
          </h3>{sampleSellers.map(({ sku, qty }, index) => (
            <div className="dash-ranking" key={sku}>
              <span>{index + 1}. {items.find(i => i.sku === sku)?.name}</span>
              <strong>{qty} {t('Units')}</strong>
            </div>
          ))}<h3 className="dash-subhead">{t('Least Sold')} <small>({t('Sample')})</small>
          </h3>
          <div className="dash-ranking">
            <span>Whole Milk 1 L</span>
            <strong>3 {t('Units')}</strong>
          </div>
        </section>
        <section className="dash-panel">
          <h3>{t('Top Loss Products')}</h3>{bySku.filter(x => x.qty > 0).slice(0, 5).map(x => (
            <div className="dash-ranking" key={x.item.sku}>
              <span>{x.item.name} {x.item.variant}</span>
              <strong>{x.qty} {t('Units')}</strong>
            </div>
          ))}{lossUnits === 0 && <p className="ops-empty">{t('No loss reports yet.')}</p>}</section>
        <section className="dash-panel">
          <h3>{t('Loss Reasons')}</h3>{['Expired', 'Quality', 'Damaged', 'Confirmed Theft', 'Other'].map(reason => (
            <div className="dash-ranking" key={reason}>
              <span>{t(reason)}</span>
              <strong>{loss.filter(o => o.reason.startsWith(reason)).reduce((s, o) => s + o.quantity, 0)}</strong>
            </div>
          ))}<div className="dash-ranking">
            <span>{t('Unexplained shortages')}</span>
            <strong>{shrinkUnits}</strong>
          </div>
        </section>
      </div>
      <p className="ops-footnote">
        {t('Sales charts are illustrative. Inventory and loss metrics reflect demo operations during this session.')}
      </p>
    </section>
  )
}
