import { useMemo, useState } from "react";
import {
  Download,
  Printer,
  CalendarCheck,
  Database,
  Package,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import ChopsSelect from "../components/ChopsSelect";
import ChopsDatePicker from "../components/ChopsDatePicker";
import {
  useOperations,
} from "../demo/OperationsContext";

import type {
  Operation,
} from "../demo/OperationsContext";

import "../styles/reports.css";

type Period = "week" | "month" | "custom" | "all";
type CsvValue = string | number | null | undefined;

type Closing = {
  id: string;
  name: string;
  start: string;
  end: string;
  createdAt: string;
  operations: Operation[];
  stockSnapshot: Record<
    string,
    { exhibition: number; warehouse: number }
  >;
};

const CLOSINGS_KEY = "chops-report-closings-v1";

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function beginningOfWeek() {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dateKey(date);
}

function beginningOfMonth() {
  const now = new Date();
  return dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

function readClosings(): Closing[] {
  try {
    const raw = localStorage.getItem(CLOSINGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Closing[] : [];
  } catch {
    return [];
  }
}

function csvCell(value: CsvValue) {
  const text = String(value ?? "");
  const safe =
    /^[=+@\t\r]/.test(text) ||
      (text.startsWith("-") && !/^-?\d+(\.\d+)?$/.test(text))
      ? "'" + text
      : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadFile(
  filename: string,
  content: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCSV(
  filename: string,
  headers: string[],
  rows: CsvValue[][]
) {
  const csv =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

  downloadFile(filename, csv, "text/csv;charset=utf-8");
}

function downloadJSON(filename: string, value: unknown) {
  downloadFile(
    filename,
    JSON.stringify(value, null, 2),
    "application/json;charset=utf-8"
  );
}

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { items, balances, operations } = useOperations();

  const [period, setPeriod] = useState<Period>("month");
  const [start, setStart] = useState(beginningOfMonth);
  const [end, setEnd] = useState(() => dateKey(new Date()));
  const [closingName, setClosingName] = useState("");

  const [closings, setClosings] = useState<Closing[]>(
    readClosings
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const locale = language === "es" ? "es-PE" : "en-US";

  const validPeriod =
    period === "all" || (!!start && !!end && start <= end);

  const selectedOperations = useMemo(() => {
    if (!validPeriod) return [];

    if (period === "all") return operations;

    return operations.filter((operation) => {
      const day = dateKey(new Date(operation.createdAt));
      return day >= start && day <= end;
    });
  }, [operations, period, start, end, validPeriod]);

  function findProduct(sku: string) {
    return items.find((item) => item.sku === sku);
  }

  const stats = useMemo(() => {
    const byType = (kind: Operation["kind"]) =>
      selectedOperations.filter((op) => op.kind === kind);

    const received = byType("in").reduce(
      (sum, op) => sum + op.quantity,
      0
    );

    const dispatched = byType("out").reduce(
      (sum, op) => sum + op.quantity,
      0
    );

    const transfers = byType("transfer").length;

    const losses = byType("loss");
    const lossUnits = losses.reduce(
      (sum, op) => sum + op.quantity,
      0
    );

    const lossCost = losses.reduce(
      (sum, op) =>
        sum + op.quantity * (findProduct(op.sku)?.cost ?? 0),
      0
    );

    const shortages = byType("count")
      .filter((op) => (op.counted ?? 0) < (op.previous ?? 0))
      .reduce((sum, op) => sum + op.quantity, 0);

    return {
      received,
      dispatched,
      transfers,
      lossUnits,
      lossCost,
      shortages,
    };
  }, [selectedOperations, items]);

  const currentStock = Object.values(balances).reduce(
    (sum, balance) =>
      sum + balance.exhibition + balance.warehouse,
    0
  );

  const inventoryRows: CsvValue[][] = items.map((item) => {
    const stock = balances[item.sku] ?? {
      exhibition: 0,
      warehouse: 0,
    };

    return [
      item.sku,
      item.name,
      item.variant,
      item.category,
      item.barcode,
      stock.exhibition,
      stock.warehouse,
      stock.exhibition + stock.warehouse,
      item.cost,
      item.price,
    ];
  });

  const operationHeaders = [
    "ID",
    "Date",
    "Type",
    "SKU",
    "Product",
    "Variant",
    "Quantity",
    "Source",
    "Destination",
    "Reason",
    "Previous Count",
    "Physical Count",
  ];

  function operationRows(list: Operation[]): CsvValue[][] {
    return list.map((op) => {
      const product = findProduct(op.sku);

      return [
        op.id,
        op.createdAt,
        op.kind,
        op.sku,
        product?.name,
        product?.variant,
        op.quantity,
        op.from,
        op.to,
        op.reason,
        op.previous,
        op.counted,
      ];
    });
  }

  const periodFilename =
    period === "all" ? "all-time" : `${start}_${end}`;

  function changePeriod(value: Period) {
    setPeriod(value);
    setMessage("");
    setError("");

    if (value === "week") {
      setStart(beginningOfWeek());
      setEnd(dateKey(new Date()));
    }

    if (value === "month") {
      setStart(beginningOfMonth());
      setEnd(dateKey(new Date()));
    }

    if (value === "all") {
      setStart("");
      setEnd("");
    }
  }

  function exportSummary() {
    downloadCSV(
      `chops-summary-${periodFilename}.csv`,
      ["Metric", "Value", "Unit"],
      [
        ["Operations", selectedOperations.length, "records"],
        ["Stock received", stats.received, "units"],
        ["Stock dispatched", stats.dispatched, "units"],
        ["Transfers", stats.transfers, "operations"],
        ["Loss units", stats.lossUnits, "units"],
        ["Estimated loss cost", stats.lossCost, "PEN"],
        ["Unexplained shortages", stats.shortages, "units"],
        ["Current stock", currentStock, "units"],
      ]
    );
  }

  function exportOperations(
    filename: string,
    list: Operation[]
  ) {
    downloadCSV(
      filename,
      operationHeaders,
      operationRows(list)
    );
  }

  function createClosing() {
    setMessage("");
    setError("");

    if (period === "all" || !validPeriod) {
      setError(t("Choose a valid period."));
      return;
    }

    if (
      closings.some(
        (closing) =>
          closing.start === start && closing.end === end
      )
    ) {
      setError(t("This period has already been closed."));
      return;
    }

    const closing: Closing = {
      id: crypto.randomUUID(),
      name: closingName.trim() || `${start} — ${end}`,
      start,
      end,
      createdAt: new Date().toISOString(),
      operations: structuredClone(selectedOperations),
      stockSnapshot: structuredClone(balances),
    };

    const updated = [closing, ...closings];

    try {
      localStorage.setItem(
        CLOSINGS_KEY,
        JSON.stringify(updated)
      );

      setClosings(updated);
      setClosingName("");
      setMessage(t("Close saved."));
    } catch {
      setError(t("Unable to save the closing."));
    }
  }

  const cards = [
    {
      label: "Period operations",
      value: selectedOperations.length,
      icon: Database,
    },
    {
      label: "Current stock",
      value: currentStock,
      icon: Package,
    },
    {
      label: "Recorded transfers",
      value: stats.transfers,
      icon: ArrowLeftRight,
    },
    {
      label: "Loss units in period",
      value: stats.lossUnits,
      icon: AlertTriangle,
    },
    {
      label: "Estimated loss cost",
      value: `S/ ${stats.lossCost.toFixed(2)}`,
      icon: AlertTriangle,
    },
    {
      label: "Unexplained shortage units",
      value: stats.shortages,
      icon: AlertTriangle,
    },
  ];

  return (
    <section className="reports-page">
      <header className="reports-heading">
        <div>
          <h2>{t("Reports & Analytics")}</h2>
          <p>
            {t(
              "Download reports, review performance and archive period closings."
            )}
          </p>
        </div>

        <span className="badge badge-info">
          {t("Demo / Local")}
        </span>
      </header>

      <section className="reports-panel reports-filters">
        <h3>{t("Report period")}</h3>

        <div className="reports-filter-grid">
          <div className="reports-filter-field">
            <label htmlFor="reports-period">{t("Period")}</label>
            <ChopsSelect
              id="reports-period"
              ariaLabel={t("Period")}
              value={period}
              onChange={(value) => changePeriod(value as Period)}
              options={[
                { value: "week", label: t("This week") },
                { value: "month", label: t("This month") },
                { value: "custom", label: t("Custom") },
                { value: "all", label: t("All time") },
              ]}
            />
          </div>

          <label>
            {t("Start date")}
            <ChopsDatePicker
              label={t("Start date")}
              value={start}
              locale={locale}
              disabled={period === "all"}
              onChange={(date) => {
                setStart(date);
                setPeriod("custom");
              }}
            />
          </label>

          <label>
            {t("End date")}
            <ChopsDatePicker
              label={t("End date")}
              value={end}
              locale={locale}
              disabled={period === "all"}
              onChange={(date) => {
                setEnd(date);
                setPeriod("custom");
              }}
            />
          </label>
        </div>

        {!validPeriod && (
          <p className="reports-error">
            {t("Choose a valid period.")}
          </p>
        )}
      </section>

      <div className="reports-metrics">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label}>
            <Icon size={18} />
            <span>{t(label)}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="reports-panel">
        <h3>{t("Period summary")}</h3>

        <div className="reports-line">
          <span>{t("Stock received")}</span>
          <strong>{stats.received}</strong>
        </div>

        <div className="reports-line">
          <span>{t("Stock dispatched")}</span>
          <strong>{stats.dispatched}</strong>
        </div>

        <p className="reports-caveat">
          {t(
            "Sales and profitability reports are pending Checkout integration."
          )}
        </p>
      </section>

      <section className="reports-panel">
        <h3>{t("Download reports")}</h3>

        <div className="reports-download-grid">
          <button type="button" onClick={exportSummary}>
            <Download size={16} />
            {t("Download summary CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              exportOperations(
                `chops-operations-${periodFilename}.csv`,
                selectedOperations
              )
            }
          >
            <Download size={16} />
            {t("Export operations CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              exportOperations(
                "chops-all-operations.csv",
                operations
              )
            }
          >
            <Download size={16} />
            {t("Export full history CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              downloadCSV(
                "chops-inventory-current.csv",
                [
                  "SKU",
                  "Product",
                  "Variant",
                  "Category",
                  "Barcode",
                  "Exhibition",
                  "Warehouse",
                  "Total",
                  "Cost",
                  "Price",
                ],
                inventoryRows
              )
            }
          >
            <Download size={16} />
            {t("Export inventory CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              exportOperations(
                `chops-losses-${periodFilename}.csv`,
                selectedOperations.filter(
                  (op) => op.kind === "loss"
                )
              )
            }
          >
            <Download size={16} />
            {t("Export losses CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              exportOperations(
                `chops-counts-${periodFilename}.csv`,
                selectedOperations.filter(
                  (op) => op.kind === "count"
                )
              )
            }
          >
            <Download size={16} />
            {t("Export counts CSV")}
          </button>

          <button
            type="button"
            onClick={() =>
              downloadJSON("chops-demo-backup.json", {
                app: "Chops",
                exportedAt: new Date().toISOString(),
                items,
                balances,
                operations,
                closings,
              })
            }
          >
            <Download size={16} />
            {t("Export JSON backup")}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            {t("Print report / Save PDF")}
          </button>
        </div>
      </section>

      <section className="reports-panel">
        <h3>
          <CalendarCheck size={18} />
          {t("Period closing")}
        </h3>

        <p className="reports-footnote">
          {t(
            "Closing stores a snapshot; it does not clear operations or reset inventory."
          )}
        </p>

        <div className="reports-close-row">
          <label>
            {t("Closing name")}
            <input
              value={closingName}
              maxLength={80}
              placeholder="October 2026"
              onChange={(e) =>
                setClosingName(e.target.value)
              }
            />
          </label>

          <button
            type="button"
            className="btn btn-primary"
            disabled={period === "all" || !validPeriod}
            onClick={createClosing}
          >
            {t("Close selected period")}
          </button>
        </div>

        {message && (
          <p className="reports-success" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="reports-error" role="alert">
            {error}
          </p>
        )}

        <div className="reports-history">
          <h4>{t("Closing history")}</h4>

          {closings.length === 0 ? (
            <p className="reports-footnote">
              {t("No closings yet.")}
            </p>
          ) : (
            closings.map((closing) => (
              <div className="reports-close" key={closing.id}>
                <div>
                  <strong>{closing.name}</strong>
                  <small>
                    {closing.start} — {closing.end}
                    {" · "}
                    {new Date(
                      closing.createdAt
                    ).toLocaleString(locale)}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadJSON(
                      `chops-closing-${closing.start}_${closing.end}.json`,
                      closing
                    )
                  }
                >
                  <Download size={15} />
                  {t("Download closing")}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="reports-panel">
        <h3>{t("Movement History")}</h3>

        {selectedOperations.length === 0 ? (
          <p className="reports-footnote">
            {t("No entries in this period.")}
          </p>
        ) : (
          <div className="reports-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Movement")}</th>
                  <th>{t("Product")}</th>
                  <th>{t("Quantity")}</th>
                  <th>{t("Reason")}</th>
                </tr>
              </thead>

              <tbody>
                {selectedOperations.map((op) => {
                  const product = findProduct(op.sku);

                  return (
                    <tr key={op.id}>
                      <td>
                        {new Date(
                          op.createdAt
                        ).toLocaleString(locale)}
                      </td>
                      <td>{t(op.kind)}</td>
                      <td>
                        {product?.name ?? op.sku}{" "}
                        {product?.variant}
                      </td>
                      <td>{op.quantity}</td>
                      <td>{op.reason || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="reports-caveat">
        {t(
          "Closings are local snapshots, not accounting or tax-certified books."
        )}
      </p>
    </section>
  );
}
