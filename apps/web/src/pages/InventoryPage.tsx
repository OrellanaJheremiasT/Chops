
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  ClipboardCheck,
  RefreshCcw,
  Search,
} from "lucide-react";

import { useLanguage } from "../i18n/languageHook";
import { useOperations } from "../demo/operationsHook";
import { listProducts } from "../api/products";
import { listBranches, listLocations } from "../api/locations";
import {
  inventoryDemoMode,
  listInventoryBalances,
} from "../api/inventory";
import ChopsSelect from "../components/ChopsSelect";

import type { Product } from "../api/products";
import type {
  Branch,
  StorageLocation,
} from "../api/locations";
import type { InventoryBalance } from "../api/inventory";

import "../styles/inventory-enhancements.css";

type Tab = "total" | "exhibition" | "warehouse";
type StockStatus = "all" | "low" | "out";

type InventorySnapshot = {
  products: Product[];
  branches: Branch[];
  locations: StorageLocation[];
  balances: InventoryBalance[];
};

type LoadState =
  | {
      status: "loading";
      data: null;
      error: null;
    }
  | {
      status: "ready";
      data: InventorySnapshot;
      error: null;
    }
  | {
      status: "error";
      data: null;
      error: string;
    };

type StockRow = {
  sku: string;
  name: string;
  variant: string;
  category: string;
  barcode?: string;
  exhibition: number;
  warehouse: number;
};

export default function InventoryPage() {
  const { t, language } = useLanguage();

  const spanish = language === "es";

  const translate = (en: string, es: string) =>
    spanish ? es : en;

  // Demo state is shared with Movements, Losses,
  // Stock Counts and Dashboard.
  // Live API data never comes from here.
  const {
    items: demoItems,
    balances: demoBalances,
  } = useOperations();

  const [tab, setTab] = useState<Tab>("total");
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<StockStatus>("all");

  const [branchId, setBranchId] = useState("all");
  const [locationId, setLocationId] = useState("all");

  const [refreshIndex, setRefreshIndex] = useState(0);

  const [loadState, setLoadState] =
    useState<LoadState>({
      status: "loading",
      data: null,
      error: null,
    });

  // Load live data from Spring Boot.
  useEffect(() => {
    if (inventoryDemoMode) return;

    const controller = new AbortController();
    const signal = controller.signal;

    Promise.all([
      listProducts(signal),
      listBranches(signal),
      listLocations(signal),
      listInventoryBalances(signal),
    ])
      .then(
        ([products, branches, locations, balances]) => {
          if (!signal.aborted) {
            setLoadState({
              status: "ready",
              data: {
                products,
                branches,
                locations,
                balances,
              },
              error: null,
            });
          }
        },
      )
      .catch((error: unknown) => {
        if (!signal.aborted) {
          setLoadState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }
      });

    return () => controller.abort();
  }, [refreshIndex]);

  const snapshot =
    loadState.status === "ready"
      ? loadState.data
      : null;

  // Locations belonging to the selected branch.
  const visibleLocations = useMemo(
    () =>
      (snapshot?.locations ?? []).filter(
        (location) =>
          branchId === "all" ||
          String(location.branchId) === branchId,
      ),
    [snapshot, branchId],
  );

  // Build inventory rows from real API data,
  // or from the existing demo when appropriate.
  const rows = useMemo<StockRow[]>(() => {
    if (inventoryDemoMode) {
      return demoItems.map((item) => ({
        sku: item.sku,
        name: item.name,
        variant: item.variant,
        category: item.category,
        barcode: item.barcode,
        exhibition:
          demoBalances[item.sku]?.exhibition ?? 0,
        warehouse:
          demoBalances[item.sku]?.warehouse ?? 0,
      }));
    }

    if (!snapshot || snapshot.locations.length === 0) {
      return [];
    }

    const allowed = new Map(
      visibleLocations
        .filter(
          (location) =>
            locationId === "all" ||
            String(location.id) === locationId,
        )
        .map(
          (location) =>
            [location.id, location.type] as const,
        ),
    );

    const totals = new Map<
      string,
      {
        exhibition: number;
        warehouse: number;
      }
    >();

    for (const balance of snapshot.balances) {
      const area = allowed.get(balance.locationId);

      if (!area) continue;

      const sku = balance.sku.toUpperCase();

      const current = totals.get(sku) ?? {
        exhibition: 0,
        warehouse: 0,
      };

      current[area] += balance.quantity;

      totals.set(sku, current);
    }

    return snapshot.products.flatMap((product) =>
      product.variants.map((variant) => {
        const stock = totals.get(
          variant.sku.toUpperCase(),
        );

        return {
          sku: variant.sku,
          name: product.name,
          variant: variant.name,
          category: product.category,
          exhibition: stock?.exhibition ?? 0,
          warehouse: stock?.warehouse ?? 0,
        };
      }),
    );
  }, [
    demoItems,
    demoBalances,
    snapshot,
    visibleLocations,
    locationId,
  ]);

  // Quantity depends on the selected tab.
  function quantity(row: StockRow) {
    if (tab === "total") {
      return row.exhibition + row.warehouse;
    }

    return row[tab];
  }

  // Search and stock-status filters.
  const filtered = rows.filter((row) => {
    const query = search.trim().toLowerCase();

    const matches = [
      row.name,
      row.variant,
      row.sku,
      row.category,
      row.barcode ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const units = quantity(row);

    return (
      matches &&
      (status === "all" ||
        (status === "out" && units === 0) ||
        (status === "low" &&
          units > 0 &&
          units <= 5))
    );
  });

  // Summary statistics.
  const units = rows.reduce(
    (total, row) => total + quantity(row),
    0,
  );

  const low = rows.filter(
    (row) =>
      quantity(row) > 0 &&
      quantity(row) <= 5,
  ).length;

  const out = rows.filter(
    (row) => quantity(row) === 0,
  ).length;

  const branchOptions = [
    {
      value: "all",
      label: t("All branches"),
    },
    ...(snapshot?.branches ?? []).map((branch) => ({
      value: String(branch.id),
      label: branch.name,
    })),
  ];

  const locationOptions = [
    {
      value: "all",
      label: translate(
        "All locations",
        "Todas las ubicaciones",
      ),
    },
    ...visibleLocations.map((location) => {
      const branch = snapshot?.branches.find(
        (item) => item.id === location.branchId,
      );

      return {
        value: String(location.id),
        label:
          branchId === "all" && branch
            ? `${branch.name} · ${location.name}`
            : location.name,
      };
    }),
  ];

  // Reload API data.
  function reload() {
    setLoadState({
      status: "loading",
      data: null,
      error: null,
    });

    setRefreshIndex((current) => current + 1);
  }

  const loading =
    !inventoryDemoMode &&
    loadState.status === "loading";

  const error =
    !inventoryDemoMode &&
    loadState.status === "error";

  const colSpan = tab === "total" ? 8 : 6;

  return (
    <section className="inventory-page">
      {/* PAGE HEADER */}
      <div className="page-title">
        <div>
          <h2>{t("Inventory")}</h2>

          <p>
            {t(
              "View stock by SKU, branch and storage area.",
            )}
          </p>
        </div>

        <div className="inv-title-actions">
          <span className="badge badge-info">
            {inventoryDemoMode
              ? t("Demo Data")
              : translate(
                  "API Data",
                  "Datos de la API",
                )}
          </span>

          {!inventoryDemoMode && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCcw
                size={16}
                aria-hidden="true"
              />

              {translate(
                "Refresh",
                "Actualizar",
              )}
            </button>
          )}

          {inventoryDemoMode && (
            <Link
              to="/inventory/count"
              className="btn btn-primary"
            >
              <ClipboardCheck size={16} />

              {t("Physical Stock Count")}
            </Link>
          )}
        </div>
      </div>

      {/* INVENTORY TABS */}
      <div
        className="inventory-tabs inv-tabs"
        role="tablist"
        aria-label={t("Inventory views")}
      >
        {(
          [
            ["total", "Total Stock"],
            ["exhibition", "Exhibition"],
            ["warehouse", "Warehouse"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`inventory-tab ${
              tab === value ? "active" : ""
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="inv-toolbar">
        <div className="products-search">
          <Search
            size={16}
            aria-hidden="true"
          />

          <input
            aria-label={t("Search inventory")}
            placeholder={
              inventoryDemoMode
                ? t(
                    "Search product / SKU / barcode",
                  )
                : translate(
                    "Search product / variant / SKU",
                    "Buscar producto / variante / SKU",
                  )
            }
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {!inventoryDemoMode && (
          <>
            <div className="inv-status-select">
              <ChopsSelect
                ariaLabel={t("Branch")}
                value={branchId}
                options={branchOptions}
                onChange={(value) => {
                  setBranchId(value);
                  setLocationId("all");
                }}
              />
            </div>

            <div className="inv-status-select">
              <ChopsSelect
                ariaLabel={translate(
                  "Storage location",
                  "Ubicación de inventario",
                )}
                value={locationId}
                options={locationOptions}
                onChange={setLocationId}
              />
            </div>
          </>
        )}

        <div className="inv-status-select">
          <ChopsSelect
            ariaLabel={t(
              "Filter by stock status",
            )}
            value={status}
            onChange={(value) =>
              setStatus(value as StockStatus)
            }
            options={[
              {
                value: "all",
                label: t("All stock statuses"),
              },
              {
                value: "low",
                label: t("Low Stock"),
              },
              {
                value: "out",
                label: t("Out of Stock"),
              },
            ]}
          />
        </div>
      </div>

      {/* LOADING / ERROR / INVENTORY */}
      {loading ? (
        <p
          className="products-note"
          role="status"
        >
          {translate(
            "Loading inventory from the API...",
            "Cargando inventario desde la API...",
          )}
        </p>
      ) : error ? (
        <div
          role="alert"
          className="products-note"
        >
          <p>
            {translate(
              "Could not load inventory. Check that Spring Boot is running.",
              "No se pudo cargar el inventario. Comprueba que Spring Boot esté funcionando.",
            )}
          </p>

          <p>
            {loadState.status === "error"
              ? loadState.error
              : ""}
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={reload}
          >
            {translate(
              "Try again",
              "Reintentar",
            )}
          </button>
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="inventory-summary">
            <article className="stat">
              <Boxes
                className="stat-icon"
                size={18}
              />

              <div className="stat-label">
                {t("Total units")}
              </div>

              <div className="stat-value">
                {units}
              </div>
            </article>

            <article className="stat">
              <div className="stat-label">
                {t("Low-stock SKUs")}
              </div>

              <div className="stat-value">
                {low}
              </div>
            </article>

            <article className="stat">
              <div className="stat-label">
                {t("Out-of-stock SKUs")}
              </div>

              <div className="stat-value">
                {out}
              </div>
            </article>
          </div>

          {/* EMPTY LOCATIONS MESSAGE */}
          {!inventoryDemoMode &&
            snapshot &&
            snapshot.locations.length === 0 && (
              <p
                className="products-note"
                role="status"
              >
                {translate(
                  "Create a branch and its storage locations in Locations to start tracking stock.",
                  "Crea una sucursal y sus ubicaciones en Locations para empezar a controlar las existencias.",
                )}
              </p>
            )}

          {/* INVENTORY TABLE */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Product")}</th>
                  <th>{t("Variant")}</th>
                  <th>SKU</th>
                  <th>{t("Category")}</th>

                  {tab === "total" && (
                    <>
                      <th>{t("Exhibition")}</th>
                      <th>{t("Warehouse")}</th>
                    </>
                  )}

                  <th>{t("Stock")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row) => {
                  const q = quantity(row);

                  const badge =
                    q === 0
                      ? "badge-danger"
                      : q <= 5
                        ? "badge-warning"
                        : "badge-success";

                  return (
                    <tr key={row.sku}>
                      <td>{row.name}</td>

                      <td>{row.variant}</td>

                      <td>
                        <code className="inventory-sku">
                          {row.sku}
                        </code>
                      </td>

                      <td>{t(row.category)}</td>

                      {tab === "total" && (
                        <>
                          <td>
                            {row.exhibition}
                          </td>

                          <td>
                            {row.warehouse}
                          </td>
                        </>
                      )}

                      <td>
                        <strong>{q}</strong>
                      </td>

                      <td>
                        <span
                          className={`badge ${badge}`}
                        >
                          {t(
                            q === 0
                              ? "Out of Stock"
                              : q <= 5
                                ? "Low Stock"
                                : "Available",
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={colSpan}>
                      {t(
                        "No inventory records found.",
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* INFORMATION NOTE */}
          <p className="products-note">
            {inventoryDemoMode
              ? translate(
                  "Demo inventory is saved in this browser and shared with Movements, Losses, Stock Counts and Dashboard.",
                  "El inventario demo se guarda en este navegador y se comparte con Movimientos, Mermas, Conteos y Dashboard.",
                )
              : translate(
                  "Inventory shows Spring Boot balances. Sales, Stock Counts, Losses and Dashboard still use demo data and do not update these balances yet.",
                  "Inventory muestra saldos de Spring Boot. Ventas, Conteos, Mermas y Dashboard todavía usan datos demo y aún no actualizan estos saldos.",
                )}
          </p>
        </>
      )}
    </section>
  );
}
