import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, LoaderCircle } from "lucide-react";

import { getApiHealth } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";

type ConnectionStatus = "checking" | "online" | "offline";

export default function ApiConnectionStatus() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<ConnectionStatus>("checking");

  const [refreshKey, setRefreshKey] = useState(0);

  const enable = import.meta.env.DEV || Boolean(import.meta.env.VITE_API_URL);

  useEffect(() => {
    if (!enable) return;

    const controller = new AbortController();

    getApiHealth(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setStatus("online");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("offline");
        }
      });

    return () => {
      controller.abort();
    };
  }, [enable, refreshKey]);

  if (!enable) return null;

  const descriptions = {
    checking:
      language === "es"
        ? "Comprobando conexión con la API"
        : "Checking API connection",
    online: language === "es" ? "API conectada" : "API connected",
    offline:
      language === "es"
        ? "API desconectada. Haz clic para reintentar."
        : "API offline. Click to retry.",
  };

  const description = descriptions[status];

  return (
    <button
      type="button"
      className="theme-toggle"
      title={description}
      aria-label={description}
      onClick={() => {
        setStatus("checking");
        setRefreshKey((current) => current + 1);
      }}
    >
      {status === "checking" && <LoaderCircle size={16} aria-hidden="true" />}

      {status === "online" && (
        <CheckCircle2
          size={16}
          color="var(--success, #0CCA4A)"
          aria-hidden="true"
        />
      )}

      {status === "offline" && (
        <XCircle size={16} color="var(--danger, #931621)" aria-hidden="true" />
      )}

      <span>API</span>
    </button>
  );
}
