import { createContext, useContext } from "react";

export type ToastKind = "success" | "info" | "warning" | "error";
export type ToastAPI = {
  notify: (message: string, kind?: ToastKind) => void;
};

export const ToastContext = createContext<ToastAPI | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("Missing ToastProvider");
  return context;
}
