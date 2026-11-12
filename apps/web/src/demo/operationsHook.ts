import { createContext, useContext } from "react";
import type { OperationApi } from "./OperationsContext";
export const Context = createContext<OperationApi | null>(null);
export function useOperations() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing OperationsProvider");
  return context;
}
