import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react'

import { useLanguage } from '../i18n/LanguageContext'

type PaymentMethod = 'cash' | 'card'

type CatalogItem = {
  sku: string
  barcode: string
  name: string
  variant: string
  priceCents: number
  exhibitionStock: number
}

type CartItem = {
  sku: string
  quantity: number
}

type CartDisplayItem = CatalogItem & {
  quantity: number
}

type ReceiptItem = {
  sku: string
  name: string
  variant: string
  priceCents: number
  quantity: number
}

type SaleReceipt = {
  id: string
  createdAt: string
  method: PaymentMethod
  items: ReceiptItem[]
  totalCents: number
  paidCents: number
  changeCents: number
}

// Demo stock represents the exhibition area of Main Store.
const initialCatalog: CatalogItem[] = [
  {
    sku: 'BEV-COKE-500',
    barcode: '7750010000011',
    name: 'Coca-Cola',
    variant: '500 ml',
    priceCents: 450,
    exhibitionStock: 14,
  },
  {
    sku: 'BEV-COKE-1500',
    barcode: '7750010000028',
    name: 'Coca-Cola',
    variant: '1.5 L',
    priceCents: 450,
    exhibitionStock: 0,
  },
  {
    sku: 'SNK-CHIPS-45',
    barcode: '7750010000035',
    name: 'Potato Chips',
    variant: '45 g',
    priceCents: 350,
    exhibitionStock: 12,
  },
  {
    sku: 'DAI-MILK-1L',
    barcode: '7750010000042',
    name: 'Whole Milk',
    variant: '1 L',
    priceCents: 520,
    exhibitionStock: 2,
  },
]

function formatMoney(cents: number) {
  return `S/ ${(cents / 100).toFixed(2)}`
}

export default function CheckoutPage() {
  const { t, language } = useLanguage()

  const [catalog, setCatalog] = useState(initialCatalog)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash')

  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState('')

  const [sales, setSales] = useState<SaleReceipt[]>([])
  const [lastReceipt, setLastReceipt] =
    useState<SaleReceipt | null>(null)

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase()

    return catalog.filter((product) => {
      const searchableText = [
        product.name,
        product.variant,
        product.sku,
        product.barcode,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [catalog, search])

  const cartProducts: CartDisplayItem[] = cart.flatMap((entry) => {
    const product = catalog.find(
      (item) => item.sku === entry.sku,
    )

    if (!product) return []

    return [{ ...product, quantity: entry.quantity }]
  })

  const totalCents = cartProducts.reduce(
    (total, item) =>
      total + item.priceCents * item.quantity,
    0,
  )

  const totalQuantity = cartProducts.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const receivedCents =
    cashReceived.trim() !== '' &&
      Number.isFinite(Number(cashReceived))
      ? Math.round(Number(cashReceived) * 100)
      : 0

  const changeCents =
    paymentMethod === 'cash'
      ? Math.max(0, receivedCents - totalCents)
      : 0

  function getCartQuantity(sku: string) {
    return cart.find((item) => item.sku === sku)?.quantity ?? 0
  }

  function addToCart(product: CatalogItem) {
    const currentQuantity = getCartQuantity(product.sku)

    if (currentQuantity >= product.exhibitionStock) {
      setError('Not enough exhibition stock.')
      return
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.sku === product.sku,
      )

      if (existing) {
        return current.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...current, { sku: product.sku, quantity: 1 }]
    })

    setError('')
  }

  function changeQuantity(sku: string, difference: number) {
    const product = catalog.find(
      (item) => item.sku === sku,
    )

    if (!product) return

    const nextQuantity =
      getCartQuantity(sku) + difference

    if (nextQuantity > product.exhibitionStock) {
      setError('Not enough exhibition stock.')
      return
    }

    if (nextQuantity <= 0) {
      removeFromCart(sku)
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.sku === sku
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    )

    setError('')
  }

  function removeFromCart(sku: string) {
    setCart((current) =>
      current.filter((item) => item.sku !== sku),
    )

    setError('')
  }

  function clearCart() {
    setCart([])
    setCashReceived('')
    setError('')
  }

  function completeSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (cart.length === 0) {
      setError('Add at least one product to the cart.')
      return
    }

    for (const entry of cart) {
      const product = catalog.find(
        (item) => item.sku === entry.sku,
      )

      if (
        !product ||
        entry.quantity > product.exhibitionStock
      ) {
        setError('Not enough exhibition stock.')
        return
      }
    }

    const paidCents =
      paymentMethod === 'cash'
        ? Math.round(Number(cashReceived) * 100)
        : totalCents

    if (
      paymentMethod === 'cash' &&
      (
        cashReceived.trim() === '' ||
        !Number.isFinite(paidCents) ||
        paidCents < totalCents
      )
    ) {
      setError('Received amount must cover the total.')
      return
    }

    const receiptItems: ReceiptItem[] =
      cartProducts.map((item) => ({
        sku: item.sku,
        name: item.name,
        variant: item.variant,
        priceCents: item.priceCents,
        quantity: item.quantity,
      }))

    const receipt: SaleReceipt = {
      id: `CH-${String(sales.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      method: paymentMethod,
      items: receiptItems,
      totalCents,
      paidCents,
      changeCents: Math.max(0, paidCents - totalCents),
    }

    // Deduct only demo exhibition stock.
    setCatalog((current) =>
      current.map((product) => {
        const sold = cart.find(
          (entry) => entry.sku === product.sku,
        )

        if (!sold) return product

        return {
          ...product,
          exhibitionStock:
            product.exhibitionStock - sold.quantity,
        }
      }),
    )

    setSales((current) => [receipt, ...current])
    setLastReceipt(receipt)

    setCart([])
    setCashReceived('')
    setPaymentMethod('cash')
    setError('')
  }

  return (
    <section className="checkout-page">
      <div className="page-title">
        <div>
          <h2>{t('Sales')}</h2>
          <p>
            {t('Create a sale using exhibition stock.')}
          </p>
        </div>

        <span className="badge badge-info">
          {t('Demo Data')}
        </span>
      </div>

      <div className="checkout-workspace">
        <section className="checkout-panel">
          <div className="checkout-panel-heading">
            <div>
              <h3>{t('Product Catalog')}</h3>
              <p>{t('Branch')}: Main Store</p>
            </div>
          </div>

          <div className="products-search checkout-search">
            <Search size={17} aria-hidden="true" />

            <input
              type="search"
              aria-label={t('Search products')}
              placeholder={t(
                'Search by product, SKU or barcode...',
              )}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="checkout-catalog">
            {filteredCatalog.map((product) => {
              const selected = getCartQuantity(product.sku)

              const available =
                product.exhibitionStock - selected

              return (
                <article
                  className="checkout-product"
                  key={product.sku}
                >
                  <div className="checkout-product-info">
                    <strong>{product.name}</strong>

                    <span>{product.variant}</span>

                    <code>{product.sku}</code>

                    <span
                      className={
                        product.exhibitionStock === 0
                          ? 'checkout-stock checkout-stock-out'
                          : 'checkout-stock'
                      }
                    >
                      {t('Exhibition Stock')}:{' '}
                      {product.exhibitionStock}
                    </span>
                  </div>

                  <div className="checkout-product-action">
                    <strong>
                      {formatMoney(product.priceCents)}
                    </strong>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={available <= 0}
                      onClick={() => addToCart(product)}
                      aria-label={`${t('Add to Cart')}: ${product.name} ${product.variant}`}
                    >
                      <Plus size={15} />
                      {t('Add')}
                    </button>
                  </div>
                </article>
              )
            })}

            {filteredCatalog.length === 0 && (
              <p className="checkout-empty">
                {t('No products found.')}
              </p>
            )}
          </div>
        </section>

        <section className="checkout-panel checkout-cart-panel">
          <div className="checkout-panel-heading">
            <div>
              <h3>
                <ShoppingCart size={18} />
                {t('Current Sale')}
              </h3>

              <p>
                {totalQuantity} {t('Units')}
              </p>
            </div>

            <button
              type="button"
              className="checkout-clear"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 size={14} />
              {t('Clear Cart')}
            </button>
          </div>

          <div className="checkout-cart-items">
            {cartProducts.length === 0 ? (
              <div className="checkout-empty">
                <ShoppingCart size={30} />
                <p>{t('Your cart is empty.')}</p>
                <span>
                  {t('Select products to start a sale.')}
                </span>
              </div>
            ) : (
              cartProducts.map((item) => (
                <article
                  className="checkout-cart-item"
                  key={item.sku}
                >
                  <div className="checkout-cart-item-main">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.variant}</span>
                      <code>{item.sku}</code>
                    </div>

                    <button
                      type="button"
                      className="checkout-icon-button"
                      aria-label={`${t('Remove')} ${item.name}`}
                      onClick={() => removeFromCart(item.sku)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="checkout-cart-item-bottom">
                    <div className="checkout-quantity">
                      <button
                        type="button"
                        aria-label={t('Decrease quantity')}
                        onClick={() =>
                          changeQuantity(item.sku, -1)
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label={t('Increase quantity')}
                        disabled={
                          item.quantity >=
                          item.exhibitionStock
                        }
                        onClick={() =>
                          changeQuantity(item.sku, 1)
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <strong>
                      {formatMoney(
                        item.priceCents * item.quantity,
                      )}
                    </strong>
                  </div>
                </article>
              ))
            )}
          </div>

          <form
            className="checkout-payment"
            onSubmit={completeSale}
          >
            <div className="checkout-total">
              <span>{t('Total')}</span>
              <strong>{formatMoney(totalCents)}</strong>
            </div>

            <label className="checkout-label">
              {t('Payment Method')}
            </label>

            <div className="checkout-payment-methods">
              <button
                type="button"
                aria-pressed={paymentMethod === 'cash'}
                className={
                  paymentMethod === 'cash'
                    ? 'checkout-method active'
                    : 'checkout-method'
                }
                onClick={() => {
                  setPaymentMethod('cash')
                  setError('')
                }}
              >
                <Banknote size={17} />
                {t('Cash')}
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === 'card'}
                className={
                  paymentMethod === 'card'
                    ? 'checkout-method active'
                    : 'checkout-method'
                }
                onClick={() => {
                  setPaymentMethod('card')
                  setError('')
                }}
              >
                <CreditCard size={17} />
                {t('Card')}
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="checkout-cash-field">
                <label htmlFor="checkout-cash">
                  {t('Amount Received (S/)')}
                </label>

                <input
                  id="checkout-cash"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(event) =>
                    setCashReceived(event.target.value)
                  }
                />

                <div className="checkout-change">
                  <span>{t('Change')}</span>
                  <strong>
                    {formatMoney(changeCents)}
                  </strong>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <p className="checkout-demo-warning">
                {t('Card payments are simulated. No charge will be made.')}
              </p>
            )}

            {error && (
              <p
                className="product-form-error"
                role="alert"
              >
                {t(error)}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary checkout-confirm"
              disabled={cart.length === 0}
            >
              <CheckCircle2 size={18} />
              {t('Complete Sale')}
            </button>
          </form>
        </section>
      </div>

      {lastReceipt && (
        <section
          className="checkout-panel checkout-receipt"
          aria-labelledby="checkout-receipt-title"
        >
          <div className="checkout-panel-heading">
            <div>
              <h3 id="checkout-receipt-title">
                <ReceiptText size={18} />
                {t('Sale Receipt')}
              </h3>

              <p>
                {lastReceipt.id} ·{' '}
                {new Date(lastReceipt.createdAt).toLocaleString(
                  language === 'es' ? 'es-PE' : 'en-US',
                )}
              </p>
            </div>

            <span className="badge badge-success">
              {t('Completed')}
            </span>
          </div>

          <div className="checkout-receipt-items">
            {lastReceipt.items.map((item) => (
              <div
                className="checkout-receipt-line"
                key={item.sku}
              >
                <span>
                  {item.name} ({item.variant}) ×{' '}
                  {item.quantity}
                </span>

                <strong>
                  {formatMoney(
                    item.priceCents * item.quantity,
                  )}
                </strong>
              </div>
            ))}
          </div>

          <div className="checkout-receipt-line checkout-receipt-total">
            <span>{t('Total')}</span>
            <strong>
              {formatMoney(lastReceipt.totalCents)}
            </strong>
          </div>

          <div className="checkout-receipt-line">
            <span>{t('Payment Method')}</span>
            <span>
              {t(
                lastReceipt.method === 'cash'
                  ? 'Cash'
                  : 'Card',
              )}
            </span>
          </div>

          {lastReceipt.method === 'cash' && (
            <>
              <div className="checkout-receipt-line">
                <span>{t('Amount Received')}</span>
                <span>
                  {formatMoney(lastReceipt.paidCents)}
                </span>
              </div>

              <div className="checkout-receipt-line">
                <span>{t('Change')}</span>
                <span>
                  {formatMoney(lastReceipt.changeCents)}
                </span>
              </div>
            </>
          )}
        </section>
      )}

      {sales.length > 0 && (
        <section className="checkout-panel">
          <div className="checkout-panel-heading">
            <h3>{t('Recent Sales')}</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('Sale')}</th>
                  <th>{t('Payment Method')}</th>
                  <th>{t('Units')}</th>
                  <th>{t('Total')}</th>
                </tr>
              </thead>

              <tbody>
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.id}</td>
                    <td>
                      {t(
                        sale.method === 'cash'
                          ? 'Cash'
                          : 'Card',
                      )}
                    </td>
                    <td>
                      {sale.items.reduce(
                        (sum, item) =>
                          sum + item.quantity,
                        0,
                      )}
                    </td>
                    <td>
                      {formatMoney(sale.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="products-note">
        {t(
          'Demo checkout. Sales and stock changes reset on page reload.',
        )}
      </p>
    </section>
  )
}
