import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import ChopsSelect from '../components/ChopsSelect'
import { useOperations, demoItems, itemLabel, matchesItem } from '../demo/OperationsContext'
import type { Area, LossReason } from '../demo/OperationsContext'
import '../styles/losses.css'
const reasons: LossReason[] = ['Expired', 'Quality', 'Damaged', 'Confirmed Theft', 'Other']
export default function LossesPage() {
  const { t, language } = useLanguage();
  const { balances, operations, reportLoss } = useOperations()
  const [search, setSearch] = useState('');
  const [sku, setSku] = useState('');
  const [area, setArea] = useState<Area>('exhibition');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<LossReason>('Expired');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('')
  const losses = operations.filter(o => o.kind === 'loss');
  const units = losses.reduce((s, o) => s + o.quantity, 0)
  const cost = losses.reduce((s, o) => s + o.quantity * (demoItems.find(i => i.sku === o.sku)?.cost ?? 0), 0)
  function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const err = reportLoss(sku, area, Number(quantity), reason, note);
    if (err) {
      setError(t(err));
      return
    }
    setMessage(t('Loss recorded and stock adjusted.'));
    setQuantity('');
    setNote('')
  }
  return (
    <section className="ops-page">
      <header className="ops-heading">
        <div>
          <h2>{t('Losses & Shrinkage')}</h2>
          <p>{t('Record expired, damaged or unsellable units. Do not delete catalog products.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </header>
      <div className="ops-metrics">
        <div className="ops-metric">
          <AlertTriangle size={18} />
          <span>{t('Reported loss units')}</span>
          <strong>{units}</strong>
          <small>{t('Units')}</small>
        </div>
        <div className="ops-metric">
          <span>{t('Estimated cost of losses')}</span>
          <strong>S/ {cost.toFixed(2)}</strong>
          <small>{t('Based on demo unit costs')}</small>
        </div>
        <div className="ops-metric">
          <span>{t('Loss reports')}</span>
          <strong>{losses.length}</strong>
        </div>
      </div>
      <div className="ops-columns">
        <form className="ops-panel ops-form" onSubmit={submit}>
          <h3>{t('Record a Loss')}</h3>
          <label htmlFor="loss-search">{t('Search product / SKU / barcode')}</label>
          <div className="ops-search">
            <Search size={16} />
            <input
              id="loss-search"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSku('')
              }}
              placeholder={t('Type to find a product...')}
            />
          </div>
          <div className="ops-options" role="listbox" aria-label={t('Products')}>{demoItems.filter(i => matchesItem(i, search)).map(i =>
          (
            <button
              key={i.sku}
              type="button"
              role="option"
              aria-selected={sku === i.sku}
              className={sku === i.sku ? 'selected' : ''}
              onClick={() => {
                setSku(i.sku);
                setSearch(`${i.name} ${i.variant}`)
              }}
            >{itemLabel(i)}</button>
          ))}</div>
          <label htmlFor="loss-area">{t('Location')}</label>
          <ChopsSelect
            id="loss-area"
            ariaLabel={t('Location')}
            value={area}
            onChange={value => setArea(value as Area)}
            options={[
              { value: 'exhibition', label: t('Exhibition') },
              { value: 'warehouse', label: t('Warehouse') },
            ]}
          />
          {sku && <div className="ops-selected">{t('Available Stock')}: <strong>{balances[sku]?.[area] ?? 0}</strong>
          </div>}
          <label htmlFor="loss-qty">{t('Quantity')}</label>
          <input
            id="loss-qty"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
          <label htmlFor="loss-reason">{t('Loss reason')}</label>
          <ChopsSelect
            id="loss-reason"
            ariaLabel={t('Loss reason')}
            value={reason}
            onChange={value => setReason(value as LossReason)}
            options={reasons.map(value => ({ value, label: t(value) }))}
          />
          <label htmlFor="loss-notes">{t('Reason / Notes')}</label>
          <textarea id="loss-notes" rows={3} maxLength={250} value={note} onChange={e => setNote(e.target.value)} />
          <p className="ops-footnote">{t('An unexplained stock shortage is not automatically classified as theft.')}</p>
          {error && <p className="ops-error" role="alert">{error}</p>}{message && <p className="ops-success" role="status">{message}</p>}
          <button type="submit" className="btn btn-primary ops-primary">{t('Confirm Loss')}</button>
        </form>
        <section className="ops-panel">
          <h3>{t('Loss History')}</h3>
          <div className="ops-history">{losses.map(op =>
          (
            <article className="ops-history-row" key={op.id}>
              <strong>{op.id} · {demoItems.find(i => i.sku === op.sku)?.name}</strong>
              <small>{new Date(op.createdAt).toLocaleString(language === 'es' ? 'es-PE' : 'en-US')}</small>
              <p>{op.sku} · {t(op.from === 'warehouse' ? 'Warehouse' : 'Exhibition')} · {op.quantity} {t('Units')}</p>
              <p>{op.reason}</p>
            </article>
          ))}{losses.length === 0 && <p className="ops-empty">{t('No loss reports yet.')}</p>}</div>
        </section>
      </div>
    </section>
  )
}
