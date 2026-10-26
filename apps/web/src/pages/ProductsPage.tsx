import { useLanguage } from "../i18n/LanguageContext";

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'

type Variant = {
  sku: string
  name: string
  stock: number
}

type Product = {
  id: number
  name: string
  category: string
  price: number
  variants: Variant[]
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Coca-Cola',
    category: 'Beverages',
    price: 4.5,
    variants: [
      { sku: 'BEV-COKE-500', name: '500 ml', stock: 24 },
      { sku: 'BEV-COKE-1500', name: '1.5 L', stock: 8 },
    ],
  },
  {
    id: 2,
    name: 'Potato Chips',
    category: 'Snacks',
    price: 3.5,
    variants: [
      { sku: 'SNK-CHIPS-45', name: '45 g', stock: 18 },
    ],
  },
  {
    id: 3,
    name: 'Whole Milk',
    category: 'Dairy',
    price: 5.2,
    variants: [
      { sku: 'DAI-MILK-1L', name: '1 L', stock: 4 },
    ],
  },
]

const emptyVariant = (): Variant => ({
  sku: '',
  name: '',
  stock: 0,
})

const emptyProduct = (): Product => ({
  id: 0,
  name: '',
  category: '',
  price: 0,
  variants: [emptyVariant()],
})

function getTotalStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + variant.stock,
    0,
  )
}

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [error, setError] = useState('')

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.variants.some((variant) =>
        variant.sku.toLowerCase().includes(query),
      ),
    )
  }, [products, search])

  function openCreate() {
    setEditing(emptyProduct())
    setError('')
  }

  function openEdit(product: Product) {
    setEditing({
      ...product,
      variants: product.variants.map((variant) => ({ ...variant })),
    })
    setError('')
  }

  function updateVariant(
    index: number,
    field: keyof Variant,
    value: string,
  ) {
    if (!editing) return

    const variants = editing.variants.map((variant, position) => {
      if (position !== index) return variant

      return {
        ...variant,
        [field]: field === 'stock' ? Number(value) : value,
      }
    })

    setEditing({ ...editing, variants })
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return

    const name = editing.name.trim()
    const category = editing.category.trim()
    const variants = editing.variants.map((variant) => ({
      ...variant,
      sku: variant.sku.trim().toUpperCase(),
      name: variant.name.trim(),
    }))

    if (
      !name ||
      !category ||
      variants.some((variant) => !variant.sku || !variant.name)
    ) {
      setError('Complete all required fields.')
      return
    }

    if (
      !Number.isFinite(editing.price) ||
      editing.price < 0 ||
      variants.some(
        (variant) =>
          !Number.isSafeInteger(variant.stock) ||
          variant.stock < 0,
      )
    ) {
      setError('Price and stock must be valid non-negative numbers.')
      return
    }

    const skus = variants.map((variant) => variant.sku)

    const existingSkus = products
      .filter((product) => product.id !== editing.id)
      .flatMap((product) =>
        product.variants.map((variant) => variant.sku),
      )

    if (
      new Set(skus).size !== skus.length ||
      skus.some((sku) => existingSkus.includes(sku))
    ) {
      setError('Each SKU must be unique.')
      return
    }

    const savedProduct = {
      ...editing,
      name,
      category,
      variants,
    }

    if (editing.id === 0) {
      const nextId =
        Math.max(0, ...products.map((product) => product.id)) + 1

      setProducts((current) => [
        ...current,
        { ...savedProduct, id: nextId },
      ])
    } else {
      setProducts((current) =>
        current.map((product) =>
          product.id === editing.id ? savedProduct : product,
        ),
      )
    }

    setEditing(null)
    setError('')
  }

  function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      language === "es" ? `¿Seguro que deseas eliminar "${product.name}"?` : `Are you sure you want to delete "${product.name}"?`,
    )

    if (!confirmed) return

    setProducts((current) =>
      current.filter((item) => item.id !== product.id),
    )
  }

  return (
    <section className="products-page">
      <div className="page-title">
        <div>
          <h2>{t('Products')}</h2>
          <p>{t('Manage your product catalog and SKU variants.')}</p>
        </div>

        <span className="badge badge-info">{t('Demo Data')}</span>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={17} aria-hidden="true" />

          <input
            aria-label={t('Search products')}
            placeholder={t('Search by name, category or SKU...')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
        >
          <Plus size={17} />{t('Add Product')}</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('Product')}</th>
              <th>{t('Category')}</th>
              <th>{t('Variants / SKU')}</th>
              <th>{t('Price')}</th>
              <th>{t('Stock')}</th>
              <th>{t('Actions')}</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const stock = getTotalStock(product)

              return (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>

                  <td>{product.category}</td>

                  <td>
                    <div className="product-variants">
                      {product.variants.map((variant) => (
                        <span key={variant.sku}>
                          {variant.name}: <code>{variant.sku}</code>
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>S/ {product.price.toFixed(2)}</td>

                  <td>
                    <span
                      className={`badge ${stock === 0
                          ? 'badge-danger'
                          : stock <= 5
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                    >
                      {stock}
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openEdit(product)}
                        aria-label={`${t("Edit")} ${product.name}`}
                      >
                        <Pencil size={15} />{t('Edit')}</button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => deleteProduct(product)}
                        aria-label={`${t("Delete")} ${product.name}`}
                      >
                        <Trash2 size={15} />{t('Delete')}</button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="products-empty">{t('No products found.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="products-note">{t('Demo catalog. Changes are temporary and reset on page reload.')}</p>

      {editing && (
        <div className="product-modal-backdrop">
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="product-modal-header">
              <h3 id="product-form-title">
                {editing.id === 0 ? 'Add Product' : 'Edit Product'}
              </h3>

              <button
                type="button"
                className="product-icon-button"
                onClick={() => setEditing(null)}
                aria-label={t('Close form')}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="field">
                <label htmlFor="product-name">{t('Product Name')}</label>

                <input
                  id="product-name"
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-category">{t('Category')}</label>

                <input
                  id="product-category"
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      category: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-price">{t('Base Price (S/)')}</label>

                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      price: Number(event.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="product-variant-heading">
                <h4>{t('Variants')}</h4>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      variants: [
                        ...editing.variants,
                        emptyVariant(),
                      ],
                    })
                  }
                >
                  <Plus size={15} />{t('Add Variant')}</button>
              </div>

              {editing.variants.map((variant, index) => (
                <div
                  className="product-variant-editor"
                  key={index}
                >
                  <div className="field">
                    <label htmlFor={`variant-name-${index}`}>{t('Variant')}</label>

                    <input
                      id={`variant-name-${index}`}
                      placeholder={t('e.g. 500 ml')}
                      value={variant.name}
                      onChange={(event) =>
                        updateVariant(
                          index,
                          'name',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`variant-sku-${index}`}>
                      SKU
                    </label>

                    <input
                      id={`variant-sku-${index}`}
                      placeholder={t('e.g. BEV-COKE-500')}
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(
                          index,
                          'sku',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`variant-stock-${index}`}>{t('Stock')}</label>

                    <input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariant(
                          index,
                          'stock',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  {editing.variants.length > 1 && (
                    <button
                      type="button"
                      className="product-remove-variant"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          variants: editing.variants.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                    >{t('Remove variant')}</button>
                  )}
                </div>
              ))}

              {error && (
                <p
                  className="product-form-error"
                  role="alert"
                >
                  {t(error)}
                </p>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(null)}
                >{t('Cancel')}</button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >{t('Save Product')}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
