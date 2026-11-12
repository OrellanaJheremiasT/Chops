
import { createContext, useContext } from "react";

export type DialogTone = "danger" | "warning" | "info";

export type DialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  closeLabel?: string;
  tone?: DialogTone;
};

export type DialogAPI = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
};

export const DialogContext = createContext<DialogAPI | null>(null);

export function useAppDialog(): DialogAPI {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useAppDialog requires DialogProvider");
  }

  return context;
}
