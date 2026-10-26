import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Search, PackageCheck } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import ChopsSelect from '../components/ChopsSelect'
import { useOperations, itemLabel, matchesItem } from '../demo/OperationsContext'
import type { Area } from '../demo/OperationsContext'
import '../styles/stock-movements.css'

type Kind = 'in' | 'out' | 'transfer'
export default function StockMovementsPage() {
  const { t, language } = useLanguage();
  const { balances, operations, items, register } = useOperations()
  const [kind, setKind] = useState<Kind>('in');
  const [search, setSearch] = useState('');
  const [sku, setSku] = useState('');
  const [from, setFrom] = useState<Area>('warehouse');
  const [to, setTo] = useState<Area>('exhibition');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historySearch, setHistorySearch] = useState('')
  const candidates = useMemo(() => items.filter(i => matchesItem(i, search)).slice(0, 40), [items, search])
  const selected = items.find(i => i.sku === sku)
  const today = new Date().toDateString()
  const daily = operations.filter(op => new Date(op.createdAt).toDateString() === today)
  const total = (k: Kind) => daily.filter(op => op.kind === k).reduce((sum, op) => sum + op.quantity, 0)
  const history = operations.filter(op => {
    if (!['in', 'out', 'transfer'].includes(op.kind)) return false
    const text = [
      op.sku,
      op.reason,
      items.find(i => i.sku === op.sku)?.name ?? '',
    ].join(' ').toLowerCase()
    return text.includes(historySearch.toLowerCase())
  })
  function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = register({ kind, sku, quantity: Number(quantity), from, to, reason: note });
    if (err) {
      setError(t(err));
      return
    }
    setSuccess(t('Movement registered successfully.'));
    setQuantity('');
    setNote('')
  }
  return (
    <section className="ops-page">
      <header className="ops-heading">
        <div>
          <h2>{t('Stock Movements')}</h2>
          <p>{t('Receive goods, record internal exits and transfer items between storage areas.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </header>
      <div className="ops-metrics">
        <article className="ops-metric">
          <ArrowDownToLine size={18} />
          <span>{t('Received today')}</span>
          <strong>{total('in')}</strong>
          <small>{t('Units')}</small>
        </article>
        <article className="ops-metric">
          <ArrowUpFromLine size={18} />
          <span>{t('Out today')}</span>
          <strong>{total('out')}</strong>
          <small>{t('Units')}</small>
        </article>
        <article className="ops-metric">
          <ArrowLeftRight size={18} />
          <span>{t('Transferred today')}</span>
          <strong>{total('transfer')}</strong>
          <small>{t('Units')}</small>
        </article>
        <article className="ops-metric">
          <PackageCheck size={18} />
          <span>{t('Latest movement')}</span>
          <strong className="ops-metric-text">{operations[0]?.id ?? '—'}</strong>
          <small>{operations.length} {t('records')}</small>
        </article>
      </div>
      <div className="ops-columns">
        <form className="ops-panel ops-form" onSubmit={submit}>
          <h3>{t('Register Movement')}</h3>
          <label>{t('Movement Type')}</label>
          <div className="ops-segment">
            {([
              ['in', 'Stock In'],
              ['out', 'Stock Out'],
              ['transfer', 'Transfer'],
            ] as const).map(([value, label]) =>
          (
            <button type="button" key={value} onClick={() => {
              setKind(value);
              setError('')
            }} className={kind === value ? 'active' : ''}>{t(label)}</button>
          ))}</div>
          <label htmlFor="sm-find">{t('Search product / SKU / barcode')}</label>
          <div className="ops-search">
            <Search size={17} />
            <input
              id="sm-find"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSku('')
              }}
              placeholder={t('Type to find a product...')}
              autoComplete="off"
            />
          </div>
          <div className="ops-options" role="listbox" aria-label={t('Products')}>
            {candidates.map(item =>
            (
              <button
                type="button"
                role="option"
                aria-selected={sku === item.sku}
                key={item.sku}
                className={sku === item.sku ? 'selected' : ''}
                onClick={() => {
                  setSku(item.sku);
                  setSearch(`${item.name} ${item.variant}`)
                }}
              >
                <span>{itemLabel(item)}</span>
                <small>
                  {t('Exhibition')}: {balances[item.sku]?.exhibition ?? 0} ·{' '}
                  {t('Warehouse')}: {balances[item.sku]?.warehouse ?? 0}
                </small>
              </button>
            ))}
            {!candidates.length && <p>{t('No products found.')}</p>}
          </div>
          {selected && <div className="ops-selected">
            <strong>{itemLabel(selected)}</strong>
            <span>{t('Current stock')}: {balances[sku].exhibition + balances[sku].warehouse}</span>
          </div>}
          {kind !== 'in' && <>
            <label htmlFor="sm-source">{t('Source Location')}</label>
            <ChopsSelect
              id="sm-source"
              ariaLabel={t('Source Location')}
              value={from}
              onChange={value => setFrom(value as Area)}
              options={[
                { value: 'warehouse', label: t('Warehouse') },
                { value: 'exhibition', label: t('Exhibition') },
              ]}
            />
          </>}
          {kind !== 'out' && <>
            <label htmlFor="sm-destination">{t('Destination Location')}</label>
            <ChopsSelect
              id="sm-destination"
              ariaLabel={t('Destination Location')}
              value={to}
              onChange={value => setTo(value as Area)}
              options={[
                { value: 'warehouse', label: t('Warehouse') },
                { value: 'exhibition', label: t('Exhibition') },
              ]}
            />
          </>}
          <label htmlFor="sm-qty">{t('Quantity')}</label>
          <input
            id="sm-qty"
            required
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
          <label htmlFor="sm-note">{t('Reason / Notes')}</label>
          <textarea
            id="sm-note"
            rows={2}
            maxLength={250}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('Optional movement description...')}
          />
          {error && <p className="ops-error" role="alert">{error}</p>}{success && <p className="ops-success" role="status">{success}</p>}
          <button className="btn btn-primary ops-primary" type="submit">{t(kind === 'in' ? 'Receive Goods' : 'Register Movement')}</button>
        </form>
        <section className="ops-panel">
          <h3>{t('Movement History')}</h3>
          <div className="ops-search">
            <Search size={17} />
            <input
              aria-label={t('Search movements')}
              placeholder={t('Search movements...')}
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
          </div>
          <div className="ops-history">{history.map(op =>
          (
            <article className="ops-history-row" key={op.id}>
              <div>
                <strong>{t(op.kind === 'in' ? 'Stock In' : op.kind === 'out' ? 'Stock Out' : 'Transfer')} · {op.id}</strong>
                <small>{new Date(op.createdAt).toLocaleString(language === 'es' ? 'es-PE' : 'en-US')}</small>
              </div>
              <p>{itemLabel(items.find(i => i.sku === op.sku)!)}</p>
              <p>
                {op.from
                  ? t(op.from === 'warehouse' ? 'Warehouse' : 'Exhibition')
                  : t('External')}
                {' → '}
                {op.to
                  ? t(op.to === 'warehouse' ? 'Warehouse' : 'Exhibition')
                  : t('External')}
              </p>
              <strong>{op.quantity} {t('Units')}</strong>{op.reason && <small>{op.reason}</small>}</article>
          ))}{!history.length && <p className="ops-empty">{t('No movements found.')}</p>}</div>
        </section>
      </div>
      <p className="ops-footnote">
        {t('Demo operations are shared between Inventory, Movements, Losses and Dashboard until page reload.')}
      </p>
    </section>
  )
}
