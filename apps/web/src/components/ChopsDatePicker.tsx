import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import "./ChopsDatePicker.css";

type Props = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  locale?: string;
};

function formatKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : new Date();
}

export default function ChopsDatePicker({ label, value, disabled = false, onChange, locale = "es-PE" }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const date = fromKey(value);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = value ? fromKey(value) : null;
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weekdayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const localizedWeekdays = locale.startsWith("es") ? ["L", "M", "X", "J", "V", "S", "D"] : weekdayNames;
  const display = selected ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(selected) : "—";

  function moveMonth(change: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + change, 1));
  }

  return (
    <div className="chops-date" ref={container}>
      <button
        type="button"
        ref={trigger}
        className="chops-date__trigger"
        disabled={disabled}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open) {
            const date = fromKey(value);
            setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
          }
          setOpen(!open);
        }}
      >
        <span>{display}</span>
        <CalendarDays size={16} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div className="chops-date__popup" role="dialog" aria-label={label}>
          <div className="chops-date__month">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={18}/></button>
            <strong>{new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}</strong>
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18}/></button>
          </div>
          <div className="chops-date__grid">
            {localizedWeekdays.map((day, index) => <span className="chops-date__weekday" key={index}>{day}</span>)}
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const key = formatKey(month.getFullYear(), month.getMonth(), day);
              return (
                <button
                  type="button"
                  key={key}
                  className={key === value ? "is-selected" : ""}
                  aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date(month.getFullYear(), month.getMonth(), day))}
                  aria-pressed={key === value}
                  onClick={() => { onChange(key); setOpen(false); trigger.current?.focus(); }}
                >{day}</button>
              );
            })}
          </div>
          <button type="button" className="chops-date__today" onClick={() => {
            const today = new Date();
            onChange(formatKey(today.getFullYear(), today.getMonth(), today.getDate()));
            setOpen(false);
          }}>{locale.startsWith("es") ? "Hoy" : "Today"}</button>
        </div>
      )}
    </div>
  );
}
