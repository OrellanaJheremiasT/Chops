import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../api/client";
import {
  createInventoryMovement,
  inventoryDemoMode,
  listInventoryBalances,
  listInventoryMovements,
} from "../api/inventory";
import type { MovementKind } from "../api/inventory";
import { listBranches, listLocations } from "../api/locations";
import { listProducts } from "../api/products";
import ChopsSelect from "../components/ChopsSelect";
import { useToast } from "../components/toastContext";
import { useLanguage } from "../i18n/languageHook";
import DemoStockMovementsPage from "./DemoStockMovementsPage";

import "../styles/stock-movements.css";

const kinds: MovementKind[] = ["IN", "OUT", "TRANSFER"];

const kindLabels: Record<MovementKind, string> = {
  IN: "Stock In",
  OUT: "Stock Out",
  TRANSFER: "Transfer",
};

async function loadSnapshot(signal: AbortSignal) {
  const [products, branches, locations, balances, movements] = await Promise.all([
    listProducts(signal),
    listBranches(signal),
    listLocations(signal),
    listInventoryBalances(signal),
    listInventoryMovements({}, signal),
  ]);

  return { products, branches, locations, balances, movements };
}

type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;

function describePostError(error: unknown, spanish: boolean): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return spanish
          ? "Movimiento inválido. Revisa la cantidad, el origen y el destino."
          : "Invalid movement. Check the quantity, source and destination.";
      case 404:
        return spanish
          ? "El SKU o la ubicación ya no existe. Revisa la selección."
          : "The SKU or location no longer exists. Check your selection.";
      case 409:
        if (error.message === "Insufficient stock") {
          return spanish
            ? "Stock insuficiente en la ubicación de origen."
            : "Insufficient stock at the source location.";
        }
        if (error.message === "Location is inactive" || error.message === "Branch is inactive") {
          return spanish
            ? "La ubicación o su sucursal está inactiva."
            : "The location or its branch is inactive.";
        }
        return spanish
          ? `Conflicto al registrar el movimiento: ${error.message}`
          : `Movement conflict: ${error.message}`;
    }
  }

  // Si se pierde la respuesta, el servidor podría haber registrado el POST.
  return spanish
    ? "No se pudo confirmar el resultado. Revisa el historial antes de volver a enviar."
    : "The result could not be confirmed. Check the history before submitting again.";
}

export default function StockMovementsPage() {
  return inventoryDemoMode ? <DemoStockMovementsPage /> : <ApiStockMovementsPage />;
}

function ApiStockMovementsPage() {
  const { t, language } = useLanguage();
  const { notify } = useToast();
  const spanish = language === "es";
  const label = (en: string, es: string) => (spanish ? es : en);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState("");
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [kind, setKind] = useState<MovementKind>("IN");
  const [productSearch, setProductSearch] = useState("");
  const [sku, setSku] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const requestController = useRef<AbortController | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    requestController.current = controller;

    loadSnapshot(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSnapshot(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "API unavailable");
        }
      });

    return () => controller.abort();
  }, [version]);

  function refresh() {
    setLoadError("");
    setSnapshot(null);
    setVersion((current) => current + 1);
  }

  const loading = snapshot === null && !loadError;
  const branches = new Map(snapshot?.branches.map((branch) => [branch.id, branch]));
  const locations = snapshot?.locations ?? [];

  function locationLabel(id: number | null): string {
    if (id === null) return t("External");

    const location = locations.find((item) => item.id === id);
    if (!location) return `#${id}`;

    const branchName = location.branchId === null
      ? t("Central / Independent")
      : branches.get(location.branchId)?.name ?? `#${location.branchId}`;

    return `${branchName} · ${location.name}`;
  }

  const activeLocations = locations.filter(
    (location) => location.active &&
      (location.branchId === null || branches.get(location.branchId)?.active),
  );

  const locationOptions = activeLocations.map((location) => ({
    value: String(location.id),
    label: locationLabel(location.id),
  }));

  const variants = (snapshot?.products ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      value: variant.sku,
      label: `${product.name} · ${variant.name} · ${variant.sku}`,
    })),
  );

  const query = productSearch.trim().toLowerCase();
  const visibleVariants = variants.filter((item) => item.label.toLowerCase().includes(query));
  const selectedSku = visibleVariants.some((item) => item.value === sku) ? sku : "";

  const sourceId = kind === "IN"
    ? null
    : activeLocations.find((item) => String(item.id) === source)?.id ?? null;

  const destinationOptions = locationOptions.filter(
    (item) => kind !== "TRANSFER" || item.value !== String(sourceId),
  );

  const destinationId = kind === "OUT" || !destinationOptions.some(
    (item) => item.value === destination,
  ) ? null : Number(destination);

  function balanceAt(locationId: number) {
    return snapshot?.balances.find(
      (item) => item.sku === selectedSku && item.locationId === locationId,
    )?.quantity ?? 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const signal = requestController.current?.signal;
    if (!snapshot || !signal || signal.aborted || submitLock.current) return;

    const units = Number(quantity);
    if (!selectedSku || !Number.isSafeInteger(units) || units <= 0) {
      setFormError(t("Choose a product and a positive whole quantity."));
      return;
    }
    if ((kind !== "IN" && sourceId === null) ||
        (kind !== "OUT" && destinationId === null)) {
      setFormError(t("Choose valid locations."));
      return;
    }

    submitLock.current = true;
    setSaving(true);
    setFormError("");

    try {
      const movement = await createInventoryMovement({
        kind,
        sku: selectedSku,
        fromLocationId: sourceId,
        toLocationId: destinationId,
        quantity: units,
        reason: reason.trim(),
      }, signal);

      if (signal.aborted) return;

      notify(`${t("Movement registered successfully.")} #${movement.id}`, "success");
      setQuantity("");
      setReason("");
      refresh();
    } catch (error) {
      if (signal.aborted) return;

      const message = describePostError(error, spanish);
      setFormError(message);
      notify(message, "error");
      // Reconsulta los saldos y el historial. El POST nunca se reintenta aquí.
      refresh();
    } finally {
      submitLock.current = false;
      if (!signal.aborted) setSaving(false);
    }
  }

  const filterLocations = locations.filter(
    (item) => !branchFilter || String(item.branchId) === branchFilter,
  );
  const filterIds = new Set(
    filterLocations
      .filter((item) => !locationFilter || String(item.id) === locationFilter)
      .map((item) => item.id),
  );

  const productLabels = new Map(variants.map((item) => [item.value, item.label]));
  const historyQuery = historySearch.trim().toLowerCase();
  const movements = snapshot?.movements ?? [];
  const history = movements.filter((movement) => {
    const touchesLocation = [movement.fromLocationId, movement.toLocationId].some(
      (id) => id !== null && filterIds.has(id),
    );

    const text = [
      movement.id,
      productLabels.get(movement.sku) ?? movement.sku,
      t(kindLabels[movement.kind]),
      movement.reason,
    ].join(" ").toLowerCase();

    return (!(branchFilter || locationFilter) || touchesLocation) &&
      text.includes(historyQuery);
  });

  const locale = spanish ? "es-PE" : "en-US";
  const dayFormat = new Intl.DateTimeFormat(locale, { timeZone: "America/Lima" });
  const dateFormat = new Intl.DateTimeFormat(locale, {
    timeZone: "America/Lima", dateStyle: "short", timeStyle: "short",
  });
  const today = dayFormat.format(new Date());
  const dailyUnits = { IN: 0, OUT: 0, TRANSFER: 0 };
  for (const movement of movements) {
    if (dayFormat.format(new Date(movement.createdAt)) === today) {
      dailyUnits[movement.kind] += movement.quantity;
    }
  }

  const choose = { value: "", label: label("Select…", "Selecciona…") };

  return (
    <section className="ops-page">
      <header className="ops-heading">
        <h2>{t("Stock Movements")}</h2>
        <span className="badge badge-info">{label("API Data", "Datos de la API")}</span>
        <button type="button" className="btn btn-secondary"
          onClick={refresh} disabled={loading || saving}>
          {label("Refresh", "Actualizar")}
        </button>
      </header>

      {loading && <p role="status">{t("Loading…")}</p>}
      {loadError && (
        <p className="ops-error" role="alert">
          {label("Could not load inventory. Use Refresh.", "No se pudo cargar el inventario. Pulsa Actualizar.")}
          {" "}{loadError}
        </p>
      )}
      {formError && <p className="ops-error" role="alert">{formError}</p>}

      {snapshot && (
        <>
          <div className="ops-metrics">
            {kinds.map((value) => (
              <article className="ops-metric" key={value}>
                <span>{t({ IN: "Received today", OUT: "Out today", TRANSFER: "Transferred today" }[value])}</span>
                <strong>{dailyUnits[value]}</strong>
                <small>{t("Units")}</small>
              </article>
            ))}
            <article className="ops-metric">
              <span>{t("Latest movement")}</span>
              <strong>{movements[0] ? `#${movements[0].id}` : "—"}</strong>
              <small>{movements.length} {t("records")}</small>
            </article>
          </div>

          <div className="ops-columns">
            <form onSubmit={submit}>
              <fieldset className="ops-panel ops-form" disabled={saving}>
                <legend>{t("Register Movement")}</legend>

                <div className="ops-segment">
                  {kinds.map((value) => (
                    <button type="button" key={value}
                      aria-pressed={kind === value}
                      className={kind === value ? "active" : ""}
                      onClick={() => { setKind(value); setFormError(""); }}>
                      {t(kindLabels[value])}
                    </button>
                  ))}
                </div>

                <label htmlFor="sm-search">{t("Search products")}</label>
                <input id="sm-search" type="search" value={productSearch}
                  onChange={(event) => { setProductSearch(event.target.value); setSku(""); }} />

                <label htmlFor="sm-sku">SKU</label>
                <ChopsSelect id="sm-sku" ariaLabel="SKU" value={selectedSku}
                  options={[choose, ...visibleVariants]} onChange={setSku} />
                {!visibleVariants.length && <small>{t("No products found.")}</small>}

                {kind !== "IN" && (
                  <>
                    <label htmlFor="sm-from">{t("Source Location")}</label>
                    <ChopsSelect id="sm-from" ariaLabel={t("Source Location")}
                      value={sourceId === null ? "" : String(sourceId)}
                      options={[choose, ...locationOptions]} onChange={setSource} />
                    {selectedSku && sourceId !== null && (
                      <small>{t("Available Stock")}: {balanceAt(sourceId)}</small>
                    )}
                  </>
                )}

                {kind !== "OUT" && (
                  <>
                    <label htmlFor="sm-to">{t("Destination Location")}</label>
                    <ChopsSelect id="sm-to" ariaLabel={t("Destination Location")}
                      value={destinationId === null ? "" : String(destinationId)}
                      options={[choose, ...destinationOptions]} onChange={setDestination} />
                    {selectedSku && destinationId !== null && (
                      <small>{t("Current stock")}: {balanceAt(destinationId)}</small>
                    )}
                  </>
                )}

                {!activeLocations.length && (
                  <p role="status">{label("No active locations.", "No hay ubicaciones activas.")}</p>
                )}

                <label htmlFor="sm-qty">{t("Quantity")}</label>
                <input id="sm-qty" type="number" min="1" step="1" required
                  max={Number.MAX_SAFE_INTEGER}
                  value={quantity} onChange={(event) => setQuantity(event.target.value)} />

                <label htmlFor="sm-reason">{t("Reason / Notes")}</label>
                <textarea id="sm-reason" rows={2} maxLength={240}
                  value={reason} onChange={(event) => setReason(event.target.value)} />

                <button type="submit" className="btn btn-primary"
                  disabled={!selectedSku || !activeLocations.length}>
                  {saving ? label("Saving…", "Guardando…") : t("Register Movement")}
                </button>
              </fieldset>
            </form>

            <section className="ops-panel ops-form">
              <h3>{t("Movement History")}</h3>

              <label htmlFor="sm-history">{t("Search movements")}</label>
              <input id="sm-history" type="search" value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)} />

              <label htmlFor="sm-branch">{t("Branch")}</label>
              <ChopsSelect id="sm-branch" ariaLabel={t("Branch")} value={branchFilter}
                options={[
                  { value: "", label: t("All branches") },
                  ...snapshot.branches.map((item) => ({ value: String(item.id), label: item.name })),
                  { value: "null", label: t("Central / Independent") },
                ]}
                onChange={(value) => { setBranchFilter(value); setLocationFilter(""); }} />

              <label htmlFor="sm-location">{t("Location")}</label>
              <ChopsSelect id="sm-location" ariaLabel={t("Location")} value={locationFilter}
                options={[
                  { value: "", label: label("All locations", "Todas las ubicaciones") },
                  ...filterLocations.map((item) => ({
                    value: String(item.id), label: locationLabel(item.id),
                  })),
                ]}
                onChange={setLocationFilter} />

              <div className="ops-history">
                {history.map((movement) => (
                  <article className="ops-history-row" key={movement.id}>
                    <strong>#{movement.id} · {t(kindLabels[movement.kind])}</strong>
                    <small>{dateFormat.format(new Date(movement.createdAt))}</small>
                    <p>{productLabels.get(movement.sku) ?? movement.sku}</p>
                    <p>{locationLabel(movement.fromLocationId)} → {locationLabel(movement.toLocationId)}</p>
                    <strong>{movement.quantity} {t("Units")}</strong>
                    {movement.reason && <small>{movement.reason}</small>}
                  </article>
                ))}
                {!history.length && <p className="ops-empty">{t("No movements found.")}</p>}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}