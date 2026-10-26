
import { useMemo, useState } from "react";
import type { FormEvent } from "react";


import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Search,
  Package,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import ChopsSelect from "../components/ChopsSelect";
import { useLanguage } from "../i18n/LanguageContext";

import "../styles/StockMovementsPage.css";

type LocationId = "exhibition" | "warehouse";
type MovementType = "in" | "out" | "transfer";
type MovementFilter = "all" | MovementType;

type Product = {
  sku: string;
  name: string;
  variant: string;
};

type ProductBalance = Record<LocationId, number>;
type Balances = Record<string, ProductBalance>;

type Movement = {
  id: string;
  date: string;
  type: MovementType;
  sku: string;
  quantity: number;
  from: LocationId | null;
  to: LocationId | null;
  note: string;
};

const products: Product[] = [
  {
    sku: "BEV-COKE-500",
    name: "Coca-Cola",
    variant: "500 ml",
  },
  {
    sku: "BEV-COKE-1500",
    name: "Coca-Cola",
    variant: "1.5 L",
  },
  {
    sku: "SNK-CHIPS-45",
    name: "Potato Chips",
    variant: "45 g",
  },
  {
    sku: "DAI-MILK-1L",
    name: "Whole Milk",
    variant: "1 L",
  },
];

// Matches the initial demo stock used in Inventory.
const initialBalances: Balances = {
  "BEV-COKE-500": {
    exhibition: 14,
    warehouse: 10,
  },
  "BEV-COKE-1500": {
    exhibition: 0,
    warehouse: 8,
  },
  "SNK-CHIPS-45": {
    exhibition: 12,
    warehouse: 6,
  },
  "DAI-MILK-1L": {
    exhibition: 2,
    warehouse: 2,
  },
};

function copyBalances(source: Balances): Balances {
  return Object.fromEntries(
    Object.entries(source).map(([sku, balance]) => [
      sku,
      { ...balance },
    ])
  ) as Balances;
}

export default function StockMovementsPage() {
  const { t, language } = useLanguage();

  const [balances, setBalances] = useState<Balances>(
    () => copyBalances(initialBalances)
  );

  const [movements, setMovements] = useState<Movement[]>([]);

  const [movementType, setMovementType] =
    useState<MovementType>("transfer");

  const [selectedSku, setSelectedSku] = useState(
    products[0].sku
  );

  const [fromLocation, setFromLocation] =
    useState<LocationId>("warehouse");

  const [toLocation, setToLocation] =
    useState<LocationId>("exhibition");

  const [singleLocation, setSingleLocation] =
    useState<LocationId>("warehouse");

  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] =
    useState<MovementFilter>("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProduct = products.find(
    (product) => product.sku === selectedSku
  );

  const selectedBalance = balances[selectedSku] ?? {
    exhibition: 0,
    warehouse: 0,
  };

  const totalSelectedStock =
    selectedBalance.exhibition + selectedBalance.warehouse;

  const totalStock = Object.values(balances).reduce(
    (sum, balance) =>
      sum + balance.exhibition + balance.warehouse,
    0
  );

  const totalExhibition = Object.values(balances).reduce(
    (sum, balance) => sum + balance.exhibition,
    0
  );

  const totalWarehouse = Object.values(balances).reduce(
    (sum, balance) => sum + balance.warehouse,
    0
  );

  const locationOptions = [
    {
      value: "exhibition",
      label: t("Exhibition"),
    },
    {
      value: "warehouse",
      label: t("Warehouse"),
    },
  ];

  const typeOptions = [
    {
      value: "in",
      label: t("Stock In"),
    },
    {
      value: "out",
      label: t("Stock Out"),
    },
    {
      value: "transfer",
      label: t("Transfer"),
    },
  ];

  const productOptions = products.map((product) => ({
    value: product.sku,
    label: `${product.name} ${product.variant} · ${product.sku}`,
  }));

  function locationName(id: LocationId | null) {
    if (!id) return "—";

    return t(id === "exhibition" ? "Exhibition" : "Warehouse");
  }

  function movementName(type: MovementType) {
    if (type === "in") return t("Stock In");
    if (type === "out") return t("Stock Out");
    return t("Transfer");
  }

  function movementRoute(movement: Movement) {
    if (movement.type === "in") {
      return `${t("External")} → ${locationName(movement.to)}`;
    }

    if (movement.type === "out") {
      return `${locationName(movement.from)} → ${t("External")}`;
    }

    return `${locationName(movement.from)} → ${locationName(
      movement.to
    )}`;
  }

  function handleMovementTypeChange(value: string) {
    setMovementType(value as MovementType);
    setError("");
    setSuccess("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const parsedQuantity = Number(quantity);

    if (
      quantity.trim() === "" ||
      !Number.isSafeInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(t("Enter a valid quantity greater than zero."));
      return;
    }

    if (!selectedProduct || !balances[selectedSku]) {
      setError(t("Select a valid product."));
      return;
    }

    if (
      movementType === "transfer" &&
      fromLocation === toLocation
    ) {
      setError(t("Source and destination must be different."));
      return;
    }

    const sourceLocation =
      movementType === "transfer"
        ? fromLocation
        : movementType === "out"
          ? singleLocation
          : null;

    const destinationLocation =
      movementType === "transfer"
        ? toLocation
        : movementType === "in"
          ? singleLocation
          : null;

    if (
      sourceLocation &&
      parsedQuantity > balances[selectedSku][sourceLocation]
    ) {
      setError(t("Insufficient stock at the source location."));
      return;
    }

    const updatedBalances = copyBalances(balances);
    const productBalance = updatedBalances[selectedSku];

    if (sourceLocation) {
      productBalance[sourceLocation] -= parsedQuantity;
    }

    if (destinationLocation) {
      productBalance[destinationLocation] += parsedQuantity;
    }

    const movement: Movement = {
      id: `MOV-${String(movements.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString(),
      type: movementType,
      sku: selectedSku,
      quantity: parsedQuantity,
      from: sourceLocation,
      to: destinationLocation,
      note: note.trim(),
    };

    setBalances(updatedBalances);
    setMovements((current) => [movement, ...current]);

    setQuantity("");
    setNote("");
    setSuccess(t("Movement registered successfully."));
  }

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const product = products.find(
        (item) => item.sku === movement.sku
      );

      const searchableText = [
        movement.id,
        movement.sku,
        product?.name ?? "",
        product?.variant ?? "",
        movement.note,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesType =
        historyFilter === "all" ||
        movement.type === historyFilter;

      return matchesSearch && matchesType;
    });
  }, [movements, search, historyFilter]);

  function resetDemo() {
    setBalances(copyBalances(initialBalances));
    setMovements([]);
    setQuantity("");
    setNote("");
    setSearch("");
    setHistoryFilter("all");
    setError("");
    setSuccess("");
  }

  return (
    <section className="sm-page">
      <div className="sm-page-header">
        <div>
          <h2>{t("Stock Movements")}</h2>
          <p>
            {t(
              "Register stock entries, exits and transfers between locations."
            )}
          </p>
        </div>

        <span className="sm-demo-badge">
          {t("Demo Data")}
        </span>
      </div>

      <div className="sm-summary">
        <article className="sm-summary-card">
          <div className="sm-summary-icon">
            <Package size={18} />
          </div>

          <span>{t("Total Stock")}</span>
          <strong>{totalStock}</strong>
          <small>{t("Units")}</small>
        </article>

        <article className="sm-summary-card">
          <div className="sm-summary-icon">
            <ArrowDownToLine size={18} />
          </div>

          <span>{t("Exhibition")}</span>
          <strong>{totalExhibition}</strong>
          <small>{t("Units")}</small>
        </article>

        <article className="sm-summary-card">
          <div className="sm-summary-icon">
            <Package size={18} />
          </div>

          <span>{t("Warehouse")}</span>
          <strong>{totalWarehouse}</strong>
          <small>{t("Units")}</small>
        </article>

        <article className="sm-summary-card">
          <div className="sm-summary-icon">
            <ClipboardList size={18} />
          </div>

          <span>{t("Registered Movements")}</span>
          <strong>{movements.length}</strong>
          <small>{t("This session")}</small>
        </article>
      </div>

      <div className="sm-workspace">
        <section className="sm-panel">
          <div className="sm-panel-header">
            <div>
              <h3>{t("New Movement")}</h3>
              <p>{t("Branch")}: Main Store</p>
            </div>
          </div>

          <form className="sm-form" onSubmit={handleSubmit}>
            <div className="sm-field">
              <label>{t("Movement Type")}</label>

              <ChopsSelect
                ariaLabel={t("Movement Type")}
                value={movementType}
                options={typeOptions}
                onChange={handleMovementTypeChange}
              />
            </div>

            <div className="sm-field">
              <label>{t("Product / SKU")}</label>

              <ChopsSelect
                ariaLabel={t("Product / SKU")}
                value={selectedSku}
                options={productOptions}
                onChange={(value) => {
                  setSelectedSku(value);
                  setError("");
                  setSuccess("");
                }}
              />
            </div>

            <div className="sm-product-balance">
              <div className="sm-balance-heading">
                <span>{t("Available Stock")}</span>
                <strong>{totalSelectedStock}</strong>
              </div>

              <div className="sm-balance-grid">
                <div>
                  <span>{t("Exhibition")}</span>
                  <strong>{selectedBalance.exhibition}</strong>
                </div>

                <div>
                  <span>{t("Warehouse")}</span>
                  <strong>{selectedBalance.warehouse}</strong>
                </div>
              </div>
            </div>

            {movementType === "transfer" ? (
              <div className="sm-field-row">
                <div className="sm-field">
                  <label>{t("Source Location")}</label>

                  <ChopsSelect
                    ariaLabel={t("Source Location")}
                    value={fromLocation}
                    options={locationOptions}
                    onChange={(value) => {
                      setFromLocation(value as LocationId);
                      setError("");
                    }}
                  />
                </div>

                <div className="sm-field">
                  <label>{t("Destination Location")}</label>

                  <ChopsSelect
                    ariaLabel={t("Destination Location")}
                    value={toLocation}
                    options={locationOptions}
                    onChange={(value) => {
                      setToLocation(value as LocationId);
                      setError("");
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="sm-field">
                <label>
                  {movementType === "in"
                    ? t("Destination Location")
                    : t("Source Location")}
                </label>

                <ChopsSelect
                  ariaLabel={t("Location")}
                  value={singleLocation}
                  options={locationOptions}
                  onChange={(value) => {
                    setSingleLocation(value as LocationId);
                    setError("");
                  }}
                />
              </div>
            )}

            <div className="sm-field">
              <label htmlFor="sm-quantity">
                {t("Quantity")}
              </label>

              <input
                id="sm-quantity"
                type="number"
                min="1"
                step="1"
                placeholder={t("Enter quantity")}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                required
              />
            </div>

            <div className="sm-field">
              <label htmlFor="sm-note">
                {t("Reason / Notes")}
              </label>

              <textarea
                id="sm-note"
                rows={3}
                placeholder={t("Optional movement description...")}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={250}
              />
            </div>

            {error && (
              <div className="sm-message sm-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="sm-message sm-success" role="status">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <button
              className="sm-submit"
              type="submit"
            >
              <ArrowLeftRight size={16} />
              {t("Register Movement")}
            </button>
          </form>
        </section>

        <section className="sm-panel sm-history-panel">
          <div className="sm-panel-header">
            <div>
              <h3>{t("Movement History")}</h3>
              <p>
                {t("Review recorded inventory operations.")}
              </p>
            </div>

            <button
              type="button"
              className="sm-reset"
              onClick={resetDemo}
              disabled={movements.length === 0}
            >
              <RotateCcw size={14} />
              {t("Reset Demo")}
            </button>
          </div>

          <div className="sm-history-toolbar">
            <div className="sm-search">
              <Search size={16} />

              <input
                type="search"
                aria-label={t("Search movements")}
                placeholder={t("Search movements...")}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <ChopsSelect
              ariaLabel={t("Filter by type")}
              value={historyFilter}
              options={[
                {
                  value: "all",
                  label: t("All Types"),
                },
                ...typeOptions,
              ]}
              onChange={(value) =>
                setHistoryFilter(value as MovementFilter)
              }
            />
          </div>

          {filteredMovements.length === 0 ? (
            <div className="sm-empty">
              <ClipboardList size={32} />

              <strong>
                {t("No movements found.")}
              </strong>

              <p>
                {movements.length === 0
                  ? t(
                      "Register your first movement to see it here."
                    )
                  : t("Try changing your search or filters.")}
              </p>
            </div>
          ) : (
            <div className="sm-history-list">
              {filteredMovements.map((movement) => {
                const product = products.find(
                  (item) => item.sku === movement.sku
                );

                const Icon =
                  movement.type === "in"
                    ? ArrowDownToLine
                    : movement.type === "out"
                      ? ArrowUpFromLine
                      : ArrowLeftRight;

                return (
                  <article
                    className="sm-history-item"
                    key={movement.id}
                  >
                    <div className="sm-history-top">
                      <div className="sm-history-title">
                        <div
                          className={`sm-movement-icon sm-type-${movement.type}`}
                        >
                          <Icon size={17} />
                        </div>

                        <div>
                          <strong>
                            {movementName(movement.type)}
                          </strong>

                          <span>{movement.id}</span>
                        </div>
                      </div>

                      <span
                        className={`sm-quantity-badge sm-type-${movement.type}`}
                      >
                        {movement.type === "in"
                          ? "+"
                          : movement.type === "out"
                            ? "-"
                            : "↔"}
                        {movement.quantity}
                      </span>
                    </div>

                    <div className="sm-history-product">
                      <strong>
                        {product?.name ?? movement.sku}
                      </strong>

                      {product && (
                        <span>{product.variant}</span>
                      )}

                      <code>{movement.sku}</code>
                    </div>

                    <div className="sm-history-route">
                      {movementRoute(movement)}
                    </div>

                    {movement.note && (
                      <p className="sm-history-note">
                        {movement.note}
                      </p>
                    )}

                    <div className="sm-history-date">
                      {new Date(movement.date).toLocaleString(
                        language === "es" ? "es-PE" : "en-US"
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <p className="sm-footnote">
        {t(
          "Demo mode: movements and balances reset when the page reloads."
        )}
      </p>
    </section>
  );
}
