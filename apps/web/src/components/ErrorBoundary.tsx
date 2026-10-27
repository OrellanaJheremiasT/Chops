import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import "./StatusPanel.css";

type Props = { children: ReactNode };
type State = { error: Error | null };

function ErrorPanel({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const { t } = useLanguage();

  return (
    <section className="status-panel" role="alert">
      <AlertTriangle size={28} aria-hidden="true" />
      <h2>{t("Something went wrong")}</h2>
      <p>
        {t(
          "This section failed to load. Your saved data was not changed."
        )}
      </p>
      {/* The real error is shown, not hidden behind a generic message. */}
      <code className="status-panel-detail">{error.message}</code>
      <div className="status-panel-actions">
        <button
          type="button"
          className="status-panel-btn primary"
          onClick={onRetry}
        >
          <RotateCw size={14} aria-hidden="true" />
          {t("Try again")}
        </button>
        <button
          type="button"
          className="status-panel-btn"
          onClick={() => window.location.reload()}
        >
          {t("Reload page")}
        </button>
      </div>
    </section>
  );
}

/**
 * Catches render errors and failed lazy-chunk loads (e.g. offline after a
 * deploy). Remount it with a `key` to reset it on navigation.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chops render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPanel
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
