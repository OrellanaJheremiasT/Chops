import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

import "./ConfirmDialog.css";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
  error?: string;
  tone?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText,
  loading = false,
  error,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  const panelRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    initialFocusRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();

      if (!loading) {
        onCancel();
      }

      return;
    }

    if (event.key !== "Tab") return;

    const buttons = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ) ?? [],
    );

    if (buttons.length === 0) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="chops-confirm-overlay">
      <div
        ref={panelRef}
        className="chops-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
      >
        <div className="chops-confirm-top">
          <div className={`chops-confirm-icon chops-confirm-icon--${tone}`}>
            <AlertTriangle size={23} strokeWidth={1.8} />
          </div>

          <button
            type="button"
            className="chops-confirm-close"
            aria-label="Close"
            disabled={loading}
            onClick={onCancel}
          >
            <X size={19} />
          </button>
        </div>

        <h3 id={titleId} className="chops-confirm-title">
          {title}
        </h3>

        <p id={descriptionId} className="chops-confirm-message">
          {message}
        </p>

        {error && (
          <p className="chops-confirm-error" role="alert">
            {error}
          </p>
        )}

        <div className="chops-confirm-actions">
          {cancelText && (
            <button
              ref={initialFocusRef}
              type="button"
              className="chops-confirm-cancel"
              disabled={loading}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            ref={cancelText ? undefined : initialFocusRef}
            type="button"
            className={
              tone === "danger"
                ? "chops-confirm-submit chops-confirm-submit--danger"
                : "chops-confirm-submit chops-confirm-submit--primary"
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
