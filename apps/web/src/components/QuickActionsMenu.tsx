import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ClipboardCheck,
  FileBarChart2,
  PackagePlus,
  Plus,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import "./QuickActionsMenu.css";

const actions = [
  { label: "Receive Goods", route: "/stock-movements?action=in", icon: PackagePlus },
  { label: "Transfer Stock", route: "/stock-movements?action=transfer", icon: ArrowLeftRight },
  { label: "Sales", route: "/checkout", icon: ShoppingCart },
  { label: "Physical Stock Count", route: "/inventory/count", icon: ClipboardCheck },
  { label: "Record a Loss", route: "/losses", icon: TrendingDown },
  { label: "Reports & Analytics", route: "/reports", icon: FileBarChart2 },
];

/** Inspired by Bencho CreateMenu, but reduced to Chops navigation actions.
 *  No demo document/folder actions, no fixed 244px stage, no motion dependency.
 */
export default function QuickActionsMenu() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onOutside(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(route: string) {
    setOpen(false);
    navigate(route);
  }

  return (
    <div className="chops-quick" ref={ref}>
      <button
        className="chops-quick-trigger"
        type="button"
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <Plus size={16} aria-hidden="true" />
        <span>{t("Quick actions")}</span>
      </button>
      {open && (
        <div id={menuId} className="chops-quick-panel" aria-label={t("Quick actions")}>
          {actions.map(({ label, route, icon: Icon }) => (
            <button type="button" key={route} onClick={() => go(route)}>
              <Icon size={16} aria-hidden="true" />
              <span>{t(label)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
