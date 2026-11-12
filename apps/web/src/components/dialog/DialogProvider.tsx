
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, X } from "lucide-react";

import { DialogContext } from "./dialogContext";
import type { DialogOptions } from "./dialogContext";
import "./DialogProvider.css";

type DialogRequest = {
  id: number;
  kind: "confirm" | "alert";
  options: DialogOptions;
  resolve: (accepted: boolean) => void;
};

export default function DialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState<DialogRequest | null>(
    null
  );

  const queueRef = useRef<DialogRequest[]>([]);
  const activeRef = useRef<DialogRequest | null>(null);
  const nextId = useRef(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const messageId = useId();

  const showNext = useCallback(() => {
    if (activeRef.current) return;

    const next = queueRef.current.shift();
    if (!next) return;

    activeRef.current = next;
    setActive(next);
  }, []);

  const request = useCallback(
    (
      kind: "confirm" | "alert",
      options: DialogOptions
    ): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        queueRef.current.push({
          id: ++nextId.current,
          kind,
          options,
          resolve,
        });

        showNext();
      }),
    [showNext]
  );

  const confirm = useCallback(
    (options: DialogOptions) =>
      request("confirm", options),
    [request]
  );

  const alert = useCallback(
    async (options: DialogOptions): Promise<void> => {
      await request("alert", options);
    },
    [request]
  );

  const closeDialog = useCallback(
    (accepted: boolean) => {
      const current = activeRef.current;
      if (!current) return;

      activeRef.current = null;
      current.resolve(accepted);

      setActive(null);
      showNext();
    },
    [showNext]
  );

  useEffect(() => {
    if (!active) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      if (active.kind === "confirm") {
        cancelRef.current?.focus();
      } else {
        confirmRef.current?.focus();
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(false);
        return;
      }

      if (event.key !== "Tab") return;

      const buttons = Array.from(
        panelRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)"
        ) ?? []
      );

      if (buttons.length === 0) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [active, closeDialog]);

  const contextValue = useMemo(
    () => ({ confirm, alert }),
    [confirm, alert]
  );

  const tone = active?.options.tone ?? "info";

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {active &&
        createPortal(
          <div className="chops-dialog-overlay">
            <div
              ref={panelRef}
              className="chops-dialog-panel"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={messageId}
              data-tone={tone}
            >
              <div className="chops-dialog-top">
                <div className="chops-dialog-icon">
                  {tone === "info" ? (
                    <Info size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>

                <button
                  type="button"
                  className="chops-dialog-close"
                  aria-label={
                    active.options.closeLabel ?? "Close"
                  }
                  onClick={() => closeDialog(false)}
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id={titleId}
                className="chops-dialog-title"
              >
                {active.options.title}
              </h3>

              <p
                id={messageId}
                className="chops-dialog-message"
              >
                {active.options.message}
              </p>

              <div className="chops-dialog-actions">
                {active.kind === "confirm" && (
                  <button
                    ref={cancelRef}
                    type="button"
                    className="chops-dialog-cancel"
                    onClick={() => closeDialog(false)}
                  >
                    {active.options.cancelLabel ?? "Cancel"}
                  </button>
                )}

                <button
                  ref={confirmRef}
                  type="button"
                  className="chops-dialog-confirm"
                  onClick={() => closeDialog(true)}
                >
                  {active.options.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </DialogContext.Provider>
  );
}
