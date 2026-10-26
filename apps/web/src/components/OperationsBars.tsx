import { useMemo, useState } from "react";
import type { Operation, OperationKind } from "../demo/OperationsContext";
import { useLanguage } from "../i18n/LanguageContext";

import "./OperationsBars.css";

type Group = {
  key: string;
  label: string;
  in: number;
  out: number;
  transfer: number;
  loss: number;
  count: number;
};

const kinds: OperationKind[] = ["in", "out", "transfer", "loss", "count"];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Bencho StackedBars interaction adapted to actual stock events.
 *  Only demo operations recorded in OperationsContext contribute to values.
 *  We deliberately do not chart invented customer traffic or sales.
 */
export default function OperationsBars({
  operations,
  days = 7,
}: {
  operations: Operation[];
  days?: number;
}) {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const count = days === 30 ? 30 : 7;

  const groups = useMemo<Group[]>(() => {
    const now = new Date();
    const timeline: Group[] = Array.from({ length: count }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      date.setDate(date.getDate() - (count - index - 1));
      return {
        key: localDateKey(date),
        label: date.toLocaleDateString(language === "es" ? "es-PE" : "en-US", {
          day: "numeric",
          month: "short",
        }),
        in: 0,
        out: 0,
        transfer: 0,
        loss: 0,
        count: 0,
      };
    });
    const byDate = new Map(timeline.map((group) => [group.key, group]));
    for (const operation of operations) {
      const created = new Date(operation.createdAt);
      if (!Number.isFinite(created.getTime())) continue;
      const group = byDate.get(localDateKey(created));
      if (group) group[operation.kind] += 1;
    }
    return timeline;
  }, [operations, count, language]);

  const highest = Math.max(
    1,
    ...groups.map((group) => kinds.reduce((sum, kind) => sum + group[kind], 0)),
  );
  const current = groups.find((group) => group.key === selected);
  const recorded = groups.reduce(
    (sum, group) => sum + kinds.reduce((total, kind) => total + group[kind], 0),
    0,
  );

  return (
    <section className="dash-panel chops-operations-bars" aria-label={t("Operations by day")}>
      <div className="chops-operations-bars-title">
        <div>
          <h3>{t("Operations by day")}</h3>
          <p>{t("Recorded inventory operations, not estimated sales.")}</p>
        </div>
        <strong>{recorded} {t("records")}</strong>
      </div>
      <div className="chops-operations-legend" aria-label={t("Operation types")}>
        {kinds.map((kind) => (
          <span key={kind} data-kind={kind}>
            <i aria-hidden="true" />{t(kind)}
          </span>
        ))}
      </div>
      <div className="chops-operations-scroll">
        <div className="chops-operations-plot" style={{ minWidth: count === 30 ? 520 : 0 }}>
          {groups.map((group, index) => {
            const total = kinds.reduce((sum, kind) => sum + group[kind], 0);
            return (
              <button
                key={group.key}
                type="button"
                className="chops-operations-day"
                aria-pressed={selected === group.key}
                aria-label={`${group.label}: ${total} ${t("records")}`}
                title={`${group.label}: ${total} ${t("records")}`}
                onClick={() => setSelected(group.key === selected ? null : group.key)}
              >
                <span className="chops-operations-bar-track">
                  <span className="chops-operations-bar-content" style={{ height: `${(total / highest) * 100}%` }}>
                    {kinds.map((kind) => {
                      const share = total > 0 ? (group[kind] / total) * 100 : 0;
                      return share > 0 ? (
                        <span
                          className="chops-operations-segment"
                          data-kind={kind}
                          key={kind}
                          style={{ height: `${share}%` }}
                        />
                      ) : null;
                    })}
                  </span>
                </span>
                <span className="chops-operations-day-label">
                  {count === 7 || index % 5 === 0 || index === count - 1 ? group.label : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {current && (
        <p className="chops-operations-selection" role="status">
          <strong>{current.label}:</strong>{" "}
          {kinds.map((kind) => `${t(kind)} ${current[kind]}`).join(" · ")}
        </p>
      )}
      {recorded === 0 && <p className="ops-footnote">{t("No recorded operations for this period.")}</p>}
    </section>
  );
}
