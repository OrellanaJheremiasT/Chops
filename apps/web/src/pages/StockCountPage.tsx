import { useState } from 'react'
import type { FormEvent } from 'react'
import { ClipboardCheck, Search } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import ChopsSelect from '../components/ChopsSelect'
import { useOperations, itemLabel, matchesItem } from '../demo/OperationsContext'
import type { Area } from '../demo/OperationsContext'
import '../styles/stock-count.css'
export default function StockCountPage() {
  const { t, language } = useLanguage();
  const { items, balances, operations, countStock } = useOperations()
  const [search, setSearch] = useState('');
  const [sku, setSku] = useState('');
  const [area, setArea] = useState<Area>('exhibition');
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('')
  const current = balances[sku]?.[area] ?? 0;
  const valid = count.trim() !== '' && Number.isSafeInteger(Number(count)) && Number(count) >= 0;
  const difference = valid ? Number(count) - current : null
  const counts = operations.filter(o => o.kind === 'count')
  function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = countStock(sku, area, count.trim() === '' ? NaN : Number(count), note);
    if (err) {
      setError(t(err));
      return
    }
    setSuccess(t('Stock count saved. Difference recorded as unexplained.'));
    setCount('');
    setNote('')
  }
  return (
    <section className="ops-page">
      <header className="ops-heading">
        <div>
          <h2>{t('Physical Stock Count')}</h2>
          <p>{t('Compare physical stock against registered stock and document differences.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </header>
      <div className="ops-columns">
        <form className="ops-panel ops-form" onSubmit={submit}>
          <h3>{t('New Stock Count')}</h3>
          <label htmlFor="count-search">{t('Search product / SKU / barcode')}</label>
          <div className="ops-search">
            <Search size={16} />
            <input
              id="count-search"
              value={search}
              placeholder={t('Type to find a product...')}
              onChange={e => {
                setSearch(e.target.value);
                setSku('');
                setCount('')
              }}
            />
          </div>
          <div className="ops-options" role="listbox" aria-label={t('Products')}>{items.filter(i => matchesItem(i, search)).map(i =>
          (
            <button
              type="button"
              key={i.sku}
              role="option"
              aria-selected={sku === i.sku}
              className={sku === i.sku ? 'selected' : ''}
              onClick={() => {
                setSku(i.sku);
                setSearch(`${i.name} ${i.variant}`);
                setCount('')
              }}
            >{itemLabel(i)}</button>
          ))}</div>
          <label htmlFor="count-area">{t('Location')}</label>
          <ChopsSelect
            id="count-area"
            ariaLabel={t('Location')}
            value={area}
            onChange={value => {
              setArea(value as Area)
              setCount('')
            }}
            options={[
              { value: 'exhibition', label: t('Exhibition') },
              { value: 'warehouse', label: t('Warehouse') },
            ]}
          />
          <div className="ops-count-compare">
            <div>
              <small>{t('System stock')}</small>
              <strong>{sku ? current : '—'}</strong>
            </div>
            <div>
              <small>{t('Physical count')}</small>
              <strong>{valid ? count : '—'}</strong>
            </div>
            <div>
              <small>{t('Difference')}</small>
              <strong className={difference !== null && difference < 0 ? 'ops-negative' : ''}>
                {difference === null || !sku
                  ? '—'
                  : difference > 0
                    ? `+${difference}`
                    : difference}
              </strong>
            </div>
          </div>
          <label htmlFor="count-number">{t('Physical count')}</label>
          <input
            id="count-number"
            required
            type="number"
            min="0"
            step="1"
            value={count}
            onChange={e => setCount(e.target.value)}
          />
          <label htmlFor="count-note">{t('Reason / Notes')}</label>
          <textarea id="count-note" value={note} maxLength={250} rows={2} onChange={e => setNote(e.target.value)} />
          <p className="ops-footnote">{t('Shortages are marked as unexplained, not theft, until investigated.')}</p>
          {error && <p className="ops-error" role="alert">{error}</p>}{success && <p className="ops-success" role="status">{success}</p>}
          <button type="submit" className="btn btn-primary ops-primary">
            <ClipboardCheck size={16} />{t('Save Count')}</button>
        </form>
        <section className="ops-panel">
          <h3>{t('Count History')}</h3>
          <div className="ops-history">{counts.map(o =>
          (
            <article key={o.id} className="ops-history-row">
              <strong>{o.id} · {items.find(i => i.sku === o.sku)?.name}</strong>
              <small>{new Date(o.createdAt).toLocaleString(language === 'es' ? 'es-PE' : 'en-US')}</small>
              <p>{o.sku} · {t(o.from === 'warehouse' || o.to === 'warehouse' ? 'Warehouse' : 'Exhibition')}</p>
              <p>
                {t('System stock')}: {o.previous} → {t('Physical count')}: {o.counted} ·{' '}
                {t('Difference')}: {(o.counted ?? 0) - (o.previous ?? 0)}
              </p>
              <small>{o.reason}</small>
            </article>
          ))}{!counts.length && <p className="ops-empty">{t('No stock counts yet.')}</p>}</div>
        </section>
      </div>
    </section>
  )
}
