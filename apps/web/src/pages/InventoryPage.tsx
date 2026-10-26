import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Search, ClipboardCheck } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useOperations, matchesItem } from '../demo/OperationsContext'
import ChopsSelect from '../components/ChopsSelect'
import '../styles/inventory-enhancements.css'
type Tab = 'total' | 'exhibition' | 'warehouse'
export default function InventoryPage() {
  const { t } = useLanguage();
  const { items, balances } = useOperations()
  const [tab, setTab] = useState<Tab>('total');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all')
  const quantity = (sku: string) => tab === 'total' ? balances[sku].exhibition + balances[sku].warehouse : balances[sku][tab]
  const filtered = useMemo(
    () => items.filter(i => {
      const units = quantity(i.sku)
      return matchesItem(i, search) && (
        status === 'all' ||
        (status === 'out' && units === 0) ||
        (status === 'low' && units > 0 && units <= 5)
      )
    }),
    [items, balances, search, tab, status]
  )
  const units = items.reduce((sum, i) => sum + quantity(i.sku), 0)
  const low = items.filter(i => quantity(i.sku) > 0 && quantity(i.sku) <= 5).length
  const out = items.filter(i => quantity(i.sku) === 0).length
  return (
    <section className="inventory-page">
      <div className="page-title">
        <div>
          <h2>{t('Inventory')}</h2>
          <p>{t('View stock by SKU, branch and storage area.')}</p>
        </div>
        <div className="inv-title-actions">
          <span className="badge badge-info">{t('Demo Data')}</span>
          <Link to="/inventory/count" className="btn btn-primary">
            <ClipboardCheck size={16} />{t('Physical Stock Count')}</Link>
        </div>
      </div>
      <div className="inventory-tabs inv-tabs" role="tablist" aria-label={t('Inventory views')}>
        {([
          ['total', 'Total Stock'],
          ['exhibition', 'Exhibition'],
          ['warehouse', 'Warehouse'],
        ] as const).map(([key, label]) =>
      (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => setTab(key)}
          className={`inventory-tab ${tab === key ? 'active' : ''}`}
        >{t(label)}</button>
      ))}</div>
      <div className="inventory-summary">
        <article className="stat">
          <Boxes className="stat-icon" size={18} />
          <div className="stat-label">{t('Total units')}</div>
          <div className="stat-value">{units}</div>
        </article>
        <article className="stat">
          <div className="stat-label">{t('Low-stock SKUs')}</div>
          <div className="stat-value">{low}</div>
        </article>
        <article className="stat">
          <div className="stat-label">{t('Out-of-stock SKUs')}</div>
          <div className="stat-value">{out}</div>
        </article>
      </div>
      <div className="inv-toolbar">
        <div className="products-search">
          <Search size={16} />
          <input
            aria-label={t('Search inventory')}
            placeholder={t('Search product / SKU / barcode')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="inv-status-select">
          <ChopsSelect
            ariaLabel={t('Filter by stock status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: t('All stock statuses') },
              { value: 'low', label: t('Low Stock') },
              { value: 'out', label: t('Out of Stock') },
            ]}
          />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('Product')}</th>
              <th>{t('Variant')}</th>
              <th>SKU</th>
              <th>{t('Category')}</th>{tab === 'total' && <>
                <th>{t('Exhibition')}</th>
                <th>{t('Warehouse')}</th>
              </>}<th>{t('Stock')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>{filtered.map(i => {
            const q = quantity(i.sku);
            const badge = q === 0 ? 'badge-danger' : q <= 5 ? 'badge-warning' : 'badge-success'; return (
              <tr key={i.sku}>
                <td>{i.name}</td>
                <td>{i.variant}</td>
                <td>
                  <code className="inventory-sku">{i.sku}</code>
                </td>
                <td>{t(i.category)}</td>{tab === 'total' && <>
                  <td>{balances[i.sku].exhibition}</td>
                  <td>{balances[i.sku].warehouse}</td>
                </>}<td>
                  <strong>{q}</strong>
                </td>
                <td>
                  <span className={`badge ${badge}`}>{t(q === 0 ? 'Out of Stock' : q <= 5 ? 'Low Stock' : 'Available')}</span>
                </td>
              </tr>
            )
          })}{!filtered.length && <tr>
            <td colSpan={tab === 'total' ? 8 : 6}>{t('No inventory records found.')}</td>
          </tr>}</tbody>
        </table>
      </div>
      <p className="products-note">
        {t('Demo operations are shared between Inventory, Movements, Losses and Dashboard until page reload.')}
      </p>
    </section>
  )
}
