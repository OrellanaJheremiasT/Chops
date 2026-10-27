import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import "./StatusPanel.css";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <section className="status-panel">
      <Compass size={28} aria-hidden="true" />
      <p className="status-panel-code">404</p>
      <h2>{t("Page not found")}</h2>
      <p>{t("The page you are looking for does not exist or was moved.")}</p>
      <div className="status-panel-actions">
        <Link to="/dashboard" className="status-panel-btn primary">
          {t("Back to Dashboard")}
        </Link>
      </div>
    </section>
  );
}
