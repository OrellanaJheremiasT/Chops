
import { useMemo, useState } from 'react'
import {
    Boxes,
    Search,
    Store,
    Warehouse,
} from 'lucide-react'
import ChopsSelect from '../components/ChopsSelect'
import { useLanguage } from '../i18n/LanguageContext'

type InventoryView = 'exhibition' | 'warehouse' | 'total'
type StockFilter = 'all' | 'low' | 'out'
type LocationType = 'exhibition' | 'warehouse'

type DemoLocation = {
    id: string
    name: string
    type: LocationType
    branchId: string
}

type DemoSKU = {
    sku: string
    barcode: string
    productName: string
    variantName: string
}

type DemoBalance = {
    sku: string
    locationId: string
    quantity: number
}

const demoBranches = [
    { id: 'main', name: 'Main Store' },
]

const demoLocations: DemoLocation[] = [
    {
        id: 'main-exhibition',
        name: 'Exhibition',
        type: 'exhibition',
        branchId: 'main',
    },
    {
        id: 'main-warehouse',
        name: 'Warehouse',
        type: 'warehouse',
        branchId: 'main',
    },
]

const demoSKUs: DemoSKU[] = [
    {
        sku: 'BEV-COKE-500',
        barcode: '7750010000011',
        productName: 'Coca-Cola',
        variantName: '500 ml',
    },
    {
        sku: 'BEV-COKE-1500',
        barcode: '7750010000028',
        productName: 'Coca-Cola',
        variantName: '1.5 L',
    },
    {
        sku: 'SNK-CHIPS-45',
        barcode: '7750010000035',
        productName: 'Potato Chips',
        variantName: '45 g',
    },
    {
        sku: 'DAI-MILK-1L',
        barcode: '7750010000042',
        productName: 'Whole Milk',
        variantName: '1 L',
    },
]

// Demo-only balances. Totals match the initial product catalog.
const demoBalances: DemoBalance[] = [
    { sku: 'BEV-COKE-500', locationId: 'main-exhibition', quantity: 14 },
    { sku: 'BEV-COKE-500', locationId: 'main-warehouse', quantity: 10 },

    { sku: 'BEV-COKE-1500', locationId: 'main-exhibition', quantity: 0 },
    { sku: 'BEV-COKE-1500', locationId: 'main-warehouse', quantity: 8 },

    { sku: 'SNK-CHIPS-45', locationId: 'main-exhibition', quantity: 12 },
    { sku: 'SNK-CHIPS-45', locationId: 'main-warehouse', quantity: 6 },

    { sku: 'DAI-MILK-1L', locationId: 'main-exhibition', quantity: 2 },
    { sku: 'DAI-MILK-1L', locationId: 'main-warehouse', quantity: 2 },
]

type InventoryRow = DemoSKU & {
    exhibition: number
    warehouse: number
    total: number
}

function getStockStatus(quantity: number) {
    if (quantity === 0) {
        return {
            label: 'Out of Stock',
            className: 'badge-danger',
        }
    }

    if (quantity <= 5) {
        return {
            label: 'Low Stock',
            className: 'badge-warning',
        }
    }

    return {
        label: 'Available',
        className: 'badge-success',
    }
}

export default function InventoryPage() {
    const { t } = useLanguage()

    const [view, setView] = useState<InventoryView>('total')
    const [branchId, setBranchId] = useState('all')
    const [locationId, setLocationId] = useState('all')
    const [search, setSearch] = useState('')
    const [stockFilter, setStockFilter] = useState<StockFilter>('all')

    const availableLocations = demoLocations.filter((location) => {
        const matchesBranch =
            branchId === 'all' || location.branchId === branchId

        const matchesView =
            view === 'total' || location.type === view

        return matchesBranch && matchesView
    })

    const branchOptions = [
        { value: 'all', label: t('All branches') },
        ...demoBranches.map((branch) => ({
            value: branch.id,
            label: branch.name,
        })),
    ]

    const locationOptions = [
        { value: 'all', label: t('All locations') },
        ...availableLocations.map((location) => ({
            value: location.id,
            label: t(location.name),
        })),
    ]

    const rows = useMemo<InventoryRow[]>(() => {
        const allowedLocations = demoLocations.filter((location) => {
            if (branchId !== 'all' && location.branchId !== branchId) {
                return false
            }

            if (view !== 'total' && location.type !== view) {
                return false
            }

            if (locationId !== 'all' && location.id !== locationId) {
                return false
            }

            return true
        })

        const allowedIds = new Set(
            allowedLocations.map((location) => location.id),
        )

        const query = search.trim().toLowerCase()

        return demoSKUs
            .map((item) => {
                let exhibition = 0
                let warehouse = 0

                for (const balance of demoBalances) {
                    if (balance.sku !== item.sku) continue
                    if (!allowedIds.has(balance.locationId)) continue

                    const location = demoLocations.find(
                        (entry) => entry.id === balance.locationId,
                    )

                    if (location?.type === 'exhibition') {
                        exhibition += balance.quantity
                    }

                    if (location?.type === 'warehouse') {
                        warehouse += balance.quantity
                    }
                }

                return {
                    ...item,
                    exhibition,
                    warehouse,
                    total: exhibition + warehouse,
                }
            })
            .filter((item) => {
                const searchableText = [
                    item.productName,
                    item.variantName,
                    item.sku,
                    item.barcode,
                ]
                    .join(' ')
                    .toLowerCase()

                return searchableText.includes(query)
            })
            .filter((item) => {
                if (stockFilter === 'out') {
                    return item.total === 0
                }

                if (stockFilter === 'low') {
                    return item.total > 0 && item.total <= 5
                }

                return true
            })
    }, [branchId, locationId, view, search, stockFilter])

    const totalUnits = rows.reduce(
        (sum, item) => sum + item.total,
        0,
    )

    const lowStockCount = rows.filter(
        (item) => item.total > 0 && item.total <= 5,
    ).length

    const outOfStockCount = rows.filter(
        (item) => item.total === 0,
    ).length

    function changeView(nextView: InventoryView) {
        setView(nextView)
        setLocationId('all')
    }

    return (
        <section className="inventory-page">
            <div className="page-title">
                <div>
                    <h2>{t('Inventory')}</h2>
                    <p>
                        {t('Inventory overview by branch and storage location.')}
                    </p>
                </div>

                <span className="badge badge-info">
                    {t('Demo Data')}
                </span>
            </div>

            <div
                className="location-tabs"
                role="tablist"
                aria-label={t('Inventory views')}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'exhibition'}
                    className={
                        view === 'exhibition'
                            ? 'location-tab active'
                            : 'location-tab'
                    }
                    onClick={() => changeView('exhibition')}
                >
                    <Store size={16} />
                    {t('Exhibition')}
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'warehouse'}
                    className={
                        view === 'warehouse'
                            ? 'location-tab active'
                            : 'location-tab'
                    }
                    onClick={() => changeView('warehouse')}
                >
                    <Warehouse size={16} />
                    {t('Warehouse')}
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'total'}
                    className={
                        view === 'total'
                            ? 'location-tab active'
                            : 'location-tab'
                    }
                    onClick={() => changeView('total')}
                >
                    <Boxes size={16} />
                    {t('Total Stock')}
                </button>
            </div>

            <div className="inventory-toolbar">
                <div className="inventory-search">
                    <label htmlFor="inventory-search">
                        {t('Search inventory')}
                    </label>

                    <div className="products-search">
                        <Search size={17} aria-hidden="true" />

                        <input
                            id="inventory-search"
                            type="search"
                            placeholder={t('Search by product, SKU or barcode...')}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <div className="inventory-control">
                    <label htmlFor="inventory-branch">
                        {t('Branch')}
                    </label>

                    <ChopsSelect
                        id="inventory-branch"
                        ariaLabel={t('Branch')}
                        value={branchId}
                        options={branchOptions}
                        onChange={(next) => {
                            setBranchId(next)
                            setLocationId('all')
                        }}
                    />
                </div>

                <div className="inventory-control">
                    <label htmlFor="inventory-location">
                        {t('Location')}
                    </label>

                    <ChopsSelect
                        id="inventory-location"
                        ariaLabel={t('Location')}
                        value={locationId}
                        options={locationOptions}
                        onChange={setLocationId}
                    />
                </div>
            </div>

            <div
                className="inventory-filters"
                role="group"
                aria-label={t('Filter by stock status')}
            >
                {(
                    [
                        { value: 'all', label: 'All Stock' },
                        { value: 'low', label: 'Low Stock Only' },
                        { value: 'out', label: 'Out of Stock Only' },
                    ] as const
                ).map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        className={
                            stockFilter === filter.value
                                ? 'inventory-filter active'
                                : 'inventory-filter'
                        }
                        aria-pressed={stockFilter === filter.value}
                        onClick={() => setStockFilter(filter.value)}
                    >
                        {t(filter.label)}
                    </button>
                ))}
            </div>

            <div className="inventory-summary">
                <article className="stat">
                    <div className="stat-label">
                        {t('Total Units')}
                    </div>
                    <div className="stat-value">
                        {totalUnits}
                    </div>
                </article>

                <article className="stat">
                    <div className="stat-label">
                        {t('Low Stock SKUs')}
                    </div>
                    <div className="stat-value inventory-warning">
                        {lowStockCount}
                    </div>
                </article>

                <article className="stat">
                    <div className="stat-label">
                        {t('Out of Stock SKUs')}
                    </div>
                    <div className="stat-value inventory-danger">
                        {outOfStockCount}
                    </div>
                </article>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>{t('Product')}</th>
                            <th>SKU</th>
                            <th>{t('Barcode')}</th>

                            {view === 'total' ? (
                                <>
                                    <th>{t('Exhibition')}</th>
                                    <th>{t('Warehouse')}</th>
                                    <th>{t('Total Stock')}</th>
                                </>
                            ) : (
                                <th>{t('Stock')}</th>
                            )}

                            <th>{t('Status')}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((item) => {
                            const status = getStockStatus(item.total)

                            return (
                                <tr key={item.sku}>
                                    <td>
                                        <div className="inventory-product">
                                            <strong>{item.productName}</strong>
                                            <span>{item.variantName}</span>
                                        </div>
                                    </td>

                                    <td>
                                        <code className="inventory-sku">
                                            {item.sku}
                                        </code>
                                    </td>

                                    <td className="inventory-barcode">
                                        {item.barcode}
                                    </td>

                                    {view === 'total' ? (
                                        <>
                                            <td>{item.exhibition}</td>
                                            <td>{item.warehouse}</td>
                                            <td>
                                                <strong>{item.total}</strong>
                                            </td>
                                        </>
                                    ) : (
                                        <td>
                                            <strong>{item.total}</strong>
                                        </td>
                                    )}

                                    <td>
                                        <span className={`badge ${status.className}`}>
                                            {t(status.label)}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={view === 'total' ? 7 : 5}
                                    className="products-empty"
                                >
                                    {t('No inventory matches your filters.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="products-note">
                {t(
                    'Demo inventory. Data is not yet synchronized with Products or Locations.',
                )}
            </p>
        </section>
    )
}
