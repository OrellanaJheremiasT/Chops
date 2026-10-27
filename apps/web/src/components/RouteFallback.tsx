import { useLanguage } from "../i18n/LanguageContext";
import { PageSkeleton } from "./Skeleton";
import "./StatusPanel.css";

/** Shown only while a lazy route chunk is really downloading. */
export default function RouteFallback() {
  const { t } = useLanguage();

  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-busy="true">
      <PageSkeleton />
      <span className="sr-only">{t("Loading…")}</span>
    </div>
  );
}
