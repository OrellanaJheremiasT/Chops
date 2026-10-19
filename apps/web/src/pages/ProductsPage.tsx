
import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, X } from 'lucide-react'

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

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return

    const name = editing.name.trim()
    const category = editing.category.trim()
    const variants = editing.variants.map((variant) => ({
      ...variant,
      sku: variant.sku.trim().toUpperCase(),
      name: variant.name.trim(),
    }))

    if (!name || !category || variants.some(
      (variant) => !variant.sku || !variant.name,
    )) {
      setError('Complete all required fields.')
      return
    }

    if (!Number.isFinite(editing.price) || editing.price < 0 ||
      variants.some((variant) =>
        !Number.isSafeInteger(variant.stock) || variant.stock < 0
      )) {
      setError('Price and stock must be valid non-negative numbers.')
      return
    }

    const skus = variants.map((variant) => variant.sku)
    const existingSkus = products
      .filter((product) => product.id !== editing.id)
      .flatMap((product) => product.variants.map((variant) => variant.sku))

    if (
      new Set(skus).size !== skus.length ||
      skus.some((sku) => existingSkus.includes(sku))
    ) {
      setError('Each SKU must be unique.')
      return
    }

    const savedProduct = { ...editing, name, category, variants }

    if (editing.id === 0) {
      const nextId = Math.max(0, ...products.map((p) => p.id)) + 1
      setProducts([...products, { ...savedProduct, id: nextId }])
    } else {
      setProducts(products.map((product) =>
        product.id === editing.id ? savedProduct : product,
      ))
    }

    setEditing(null)
    setError('')
  }

  return (
    <section className="products-page">
      <div className="page-title">
        <div>
          <h2>Products</h2>
          <p>Manage your product catalog and SKU variants.</p>
        </div>
        <span className="badge badge-info">Demo Data</span>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search products"
            placeholder="Search by name, category or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={17} />
          Add Product
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Variants / SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const stock = getTotalStock(product)

              return (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
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
                    <span className={`badge ${
                      stock === 0 ? 'badge-danger' :
                      stock <= 5 ? 'badge-warning' : 'badge-success'
                    }`}>
                      {stock}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="products-empty">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="products-note">
        Demo catalog. Changes are temporary and reset on page reload.
      </p>

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
                className="product-icon-button"
                onClick={() => setEditing(null)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="field">
                <label htmlFor="product-name">Product Name</label>
                <input
                  id="product-name"
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-category">Category</label>
                <input
                  id="product-category"
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-price">Base Price (S/)</label>
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
                <h4>Variants</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      variants: [...editing.variants, emptyVariant()],
                    })
                  }
                >
                  <Plus size={15} />
                  Add Variant
                </button>
              </div>

              {editing.variants.map((variant, index) => (
                <div className="product-variant-editor" key={index}>
                  <div className="field">
                    <label htmlFor={`variant-name-${index}`}>
                      Variant
                    </label>
                    <input
                      id={`variant-name-${index}`}
                      placeholder="e.g. 500 ml"
                      value={variant.name}
                      onChange={(event) =>
                        updateVariant(index, 'name', event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`variant-sku-${index}`}>SKU</label>
                    <input
                      id={`variant-sku-${index}`}
                      placeholder="e.g. BEV-COKE-500"
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(index, 'sku', event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`variant-stock-${index}`}>Stock</label>
                    <input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariant(index, 'stock', event.target.value)
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
                    >
                      Remove variant
                    </button>
                  )}
                </div>
              ))}

              {error && <p className="product-form-error" role="alert">{error}</p>}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
