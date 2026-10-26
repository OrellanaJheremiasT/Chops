import { useMemo, useState } from "react";

import type { Operation, OperationKind } from "../demo/OperationsContext";
import { useLanguage } from "../i18n/LanguageContext";

import "./StackedBars.css";

type Granularity = "day" | "week";

type StackedBarsProps = {
  operations: Operation[];
  days: number;
};

type Bucket = {
  key: string;
  start: Date;
  end: Date;
  values: Record<OperationKind, number>;
  total: number;
};

const KINDS: OperationKind[] = ["in", "out", "transfer", "loss", "count"];

const KIND_LABEL: Record<OperationKind, string> = {
  in: "Stock In",
  out: "Stock Out",
  transfer: "Transfer",
  loss: "Losses",
  count: "Stock Counts",
};

function localDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const monday = startOfDay(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function makeBuckets(
  operations: Operation[],
  days: number,
  granularity: Granularity,
): Bucket[] {
  const periodDays = Math.max(1, Math.min(365, Math.trunc(days) || 7));
  const last = startOfDay(new Date());
  const first = new Date(last);
  first.setDate(first.getDate() - periodDays + 1);

  const start = granularity === "week" ? startOfWeek(first) : first;
  const buckets: Bucket[] = [];
  const byKey = new Map<string, Bucket>();

  for (const cursor = new Date(start); cursor <= last;) {
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + (granularity === "week" ? 6 : 0));

    const actualStart = cursor < first ? new Date(first) : new Date(cursor);
    const actualEnd = bucketEnd > last ? new Date(last) : bucketEnd;
    const key = localDay(cursor);
    const values = { in: 0, out: 0, transfer: 0, loss: 0, count: 0 };
    const bucket: Bucket = {
      key,
      start: actualStart,
      end: actualEnd,
      values,
      total: 0,
    };

    buckets.push(bucket);
    byKey.set(key, bucket);
    cursor.setDate(cursor.getDate() + (granularity === "week" ? 7 : 1));
  }

  for (const operation of operations) {
    const date = new Date(operation.createdAt);
    if (Number.isNaN(date.getTime()) || date < first || date >= new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)) {
      continue;
    }
    if (!KINDS.includes(operation.kind) || !Number.isFinite(operation.quantity) || operation.quantity <= 0) {
      continue;
    }

    const key = localDay(granularity === "week" ? startOfWeek(date) : date);
    const bucket = byKey.get(key);
    if (!bucket) continue;
    // Count movements are absolute corrections; transfers are counted once,
    // not as separate outbound and inbound transactions.
    bucket.values[operation.kind] += operation.quantity;
    bucket.total += operation.quantity;
  }

  return buckets;
}

export default function StackedBars({ operations, days }: StackedBarsProps) {
  const { t, language } = useLanguage();
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const locale = language === "es" ? "es-PE" : "en-US";

  const buckets = useMemo(
    () => makeBuckets(operations, days, granularity),
    [operations, days, granularity],
  );

  const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.total));
  const totalUnits = buckets.reduce((total, bucket) => total + bucket.total, 0);
  const active = buckets.find((bucket) => bucket.key === activeKey) ?? null;

  const dateLabel = (date: Date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short" });

  const bucketLabel = (bucket: Bucket) =>
    localDay(bucket.start) === localDay(bucket.end)
      ? dateLabel(bucket.start)
      : `${dateLabel(bucket.start)} – ${dateLabel(bucket.end)}`;

  const countText = (count: number) => count.toLocaleString(locale);

  return (
    <section className="chops-stacked-bars" aria-label={t("Inventory activity chart")}>
      <div className="chops-stacked-bars__heading">
        <div>
          <h3>{t("Inventory activity")}</h3>
          <p>{t("Units moved or adjusted in the selected period")}</p>
        </div>

        <div className="chops-stacked-bars__switch" role="group" aria-label={t("Chart grouping")}>
          <button
            type="button"
            className={granularity === "day" ? "is-selected" : ""}
            aria-pressed={granularity === "day"}
            onClick={() => { setGranularity("day"); setActiveKey(null); }}
          >
            {t("Daily")}
          </button>
          <button
            type="button"
            className={granularity === "week" ? "is-selected" : ""}
            aria-pressed={granularity === "week"}
            onClick={() => { setGranularity("week"); setActiveKey(null); }}
          >
            {t("Weekly")}
          </button>
        </div>
      </div>

      <div className="chops-stacked-bars__summary">
        <strong>{countText(totalUnits)}</strong>
        <span>{t("units of inventory activity")}</span>
      </div>

      <div className="chops-stacked-bars__chart">
        <div
          className="chops-stacked-bars__plot"
          style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          {buckets.map((bucket) => (
            <button
              key={bucket.key}
              type="button"
              className={`chops-stacked-bars__column${active?.key === bucket.key ? " is-active" : ""}`}
              aria-label={`${bucketLabel(bucket)}: ${countText(bucket.total)} ${t("Units")}`}
              aria-pressed={active?.key === bucket.key}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setActiveKey(bucket.key);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setActiveKey(null);
              }}
              onFocus={() => setActiveKey(bucket.key)}
              onBlur={() => setActiveKey(null)}
              onClick={() => setActiveKey(bucket.key)}
            >
              <span className="chops-stacked-bars__stack" aria-hidden="true">
                {KINDS.map((kind) => (
                  <span
                    key={kind}
                    className={`chops-stacked-bars__segment chops-stacked-bars__segment--${kind}`}
                    style={{ height: `${(bucket.values[kind] / maxTotal) * 100}%` }}
                  />
                ))}
              </span>

            </button>
          ))}
        </div>
        <div className="chops-stacked-bars__axis" aria-hidden="true">
          <span>{buckets.length ? dateLabel(buckets[0].start) : ""}</span>
          <span>{buckets.length ? dateLabel(buckets[buckets.length - 1].end) : ""}</span>
        </div>

        {totalUnits === 0 && (
          <div className="chops-stacked-bars__empty">
            {t("No inventory activity in this period.")}
          </div>
        )}
      </div>

      {active && (
        <div className="chops-stacked-bars__detail" role="status">
          <strong>{bucketLabel(active)}</strong>
          <span>{countText(active.total)} {t("Units")}</span>
          <div className="chops-stacked-bars__detail-breakdown">
            {KINDS.map((kind) => (
              <span key={kind}>
                <i className={`chops-stacked-bars__dot chops-stacked-bars__segment--${kind}`} />
                {t(KIND_LABEL[kind])}: {countText(active.values[kind])}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="chops-stacked-bars__legend" aria-label={t("Movement types")}>
        {KINDS.map((kind) => (
          <span key={kind}>
            <i className={`chops-stacked-bars__dot chops-stacked-bars__segment--${kind}`} />
            {t(KIND_LABEL[kind])}
          </span>
        ))}
      </div>

      <p className="chops-stacked-bars__note">
        {t("Chart uses recorded demo operations; sales are not included.")}
      </p>
    </section>
  );
}
