import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

import type { ReactNode } from "react";

export type Area = "exhibition" | "warehouse";

export type OperationKind =
  | "in"
  | "out"
  | "transfer"
  | "loss"
  | "count";

export type LossReason =
  | "Expired"
  | "Quality"
  | "Damaged"
  | "Confirmed Theft"
  | "Other";

export type Item = {
  sku: string;
  name: string;
  variant: string;
  barcode: string;
  category: string;
  cost: number;
  price: number;
};

export type Operation = {
  id: string;
  createdAt: string;
  kind: OperationKind;
  sku: string;
  quantity: number;
  from: Area | null;
  to: Area | null;
  reason: string;
  previous?: number;
  counted?: number;
};

type Balance = {
  exhibition: number;
  warehouse: number;
};

type InventoryState = Record<string, Balance>;

export const demoItems: Item[] = [
  {
    sku: "BEV-COKE-500",
    name: "Coca-Cola",
    variant: "500 ml",
    barcode: "7750010000011",
    category: "Beverages",
    cost: 2.8,
    price: 4.5,
  },
  {
    sku: "BEV-COKE-1500",
    name: "Coca-Cola",
    variant: "1.5 L",
    barcode: "7750010000028",
    category: "Beverages",
    cost: 3.5,
    price: 4.5,
  },
  {
    sku: "SNK-CHIPS-45",
    name: "Potato Chips",
    variant: "45 g",
    barcode: "7750010000035",
    category: "Snacks",
    cost: 2.1,
    price: 3.5,
  },
  {
    sku: "DAI-MILK-1L",
    name: "Whole Milk",
    variant: "1 L",
    barcode: "7750010000042",
    category: "Dairy",
    cost: 3.7,
    price: 5.2,
  },
];

const initial: InventoryState = {
  "BEV-COKE-500": {
    exhibition: 14,
    warehouse: 10,
  },
  "BEV-COKE-1500": {
    exhibition: 0,
    warehouse: 8,
  },
  "SNK-CHIPS-45": {
    exhibition: 12,
    warehouse: 6,
  },
  "DAI-MILK-1L": {
    exhibition: 2,
    warehouse: 2,
  },
};

const STORAGE_KEY = "chops-operations-demo-v1";

type Action = {
  kind: "in" | "out" | "transfer";
  sku: string;
  quantity: number;
  from?: Area;
  to?: Area;
  reason?: string;
};

type OperationApi = {
  balances: InventoryState;
  operations: Operation[];
  items: Item[];
  register: (input: Action) => string | null;
  reportLoss: (
    sku: string,
    area: Area,
    quantity: number,
    reason: LossReason,
    note: string
  ) => string | null;
  countStock: (
    sku: string,
    area: Area,
    counted: number,
    note: string
  ) => string | null;
};

type SavedState = {
  balances: InventoryState;
  operations: Operation[];
};

const Context = createContext<OperationApi | null>(null);

const locationValid = (area: unknown): area is Area =>
  area === "exhibition" || area === "warehouse";

const positive = (value: number) =>
  Number.isSafeInteger(value) && value > 0;

// Load existing data or use initial demo data.
function loadSavedState(): SavedState {
  const fallback: SavedState = {
    balances: structuredClone(initial),
    operations: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("balances" in parsed) ||
      !("operations" in parsed)
    ) {
      return fallback;
    }

    const data = parsed as Partial<SavedState>;

    if (
      !data.balances ||
      typeof data.balances !== "object" ||
      !Array.isArray(data.operations)
    ) {
      return fallback;
    }

    const validBalances = Object.keys(initial).every(
      (sku) => {
        const balance = data.balances?.[sku];

        return (
          balance &&
          Number.isSafeInteger(balance.exhibition) &&
          balance.exhibition >= 0 &&
          Number.isSafeInteger(balance.warehouse) &&
          balance.warehouse >= 0
        );
      }
    );

    const validOperations = data.operations.every(
      (operation) =>
        operation &&
        typeof operation.id === "string" &&
        typeof operation.createdAt === "string" &&
        ["in", "out", "transfer", "loss", "count"].includes(
          operation.kind
        ) &&
        typeof operation.sku === "string" &&
        Number.isSafeInteger(operation.quantity) &&
        operation.quantity > 0 &&
        (operation.from === null ||
          locationValid(operation.from)) &&
        (operation.to === null ||
          locationValid(operation.to)) &&
        typeof operation.reason === "string"
    );

    if (!validBalances || !validOperations) {
      return fallback;
    }

    return {
      balances: data.balances as InventoryState,
      operations: data.operations,
    };
  } catch {
    return fallback;
  }
}

export function OperationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [savedState] = useState(loadSavedState);

  const [balances, setBalances] = useState<InventoryState>(
    savedState.balances
  );

  const [operations, setOperations] = useState<Operation[]>(
    savedState.operations
  );

  const [nextId, setNextId] = useState(() => {
    const ids = savedState.operations.map(
      (operation) => {
        const match = /^MOV-(\d+)$/.exec(operation.id);
        return match ? Number(match[1]) : 0;
      }
    );

    return Math.max(0, ...ids) + 1;
  });

  // Automatically save whenever stock or history changes.
  useEffect(() => {
    try {
      const data: SavedState = {
        balances,
        operations,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Unable to save Chops demo data:",
        error
      );
    }
  }, [balances, operations]);

  function save(
    kind: OperationKind,
    sku: string,
    quantity: number,
    from: Area | null,
    to: Area | null,
    reason: string,
    updated: InventoryState,
    previous?: number,
    counted?: number
  ) {
    const operation: Operation = {
      id: `MOV-${String(nextId).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      kind,
      sku,
      quantity,
      from,
      to,
      reason,
      previous,
      counted,
    };

    setNextId((current) => current + 1);
    setBalances(updated);
    setOperations((current) => [operation, ...current]);
  }

  function register(action: Action): string | null {
    const { kind, sku, quantity } = action;

    if (!balances[sku] || !positive(quantity)) {
      return "Choose a product and a positive whole quantity.";
    }

    const from =
      kind === "in" ? null : action.from;

    const to =
      kind === "out" ? null : action.to;

    if (
      (from && !locationValid(from)) ||
      (to && !locationValid(to)) ||
      (!from && !to)
    ) {
      return "Choose valid locations.";
    }

    if (
      kind === "transfer" &&
      (!from || !to || from === to)
    ) {
      return "Source and destination must be different.";
    }

    if (
      (kind === "out" && !from) ||
      (kind === "in" && !to)
    ) {
      return "Choose a location.";
    }

    if (
      from &&
      balances[sku][from] < quantity
    ) {
      return "Insufficient stock at the source location.";
    }

    const updated = structuredClone(balances);

    if (from) {
      updated[sku][from] -= quantity;
    }

    if (to) {
      updated[sku][to] += quantity;
    }

    save(
      kind,
      sku,
      quantity,
      from ?? null,
      to ?? null,
      action.reason?.trim() || "",
      updated
    );

    return null;
  }

  function reportLoss(
    sku: string,
    area: Area,
    quantity: number,
    reason: LossReason,
    note: string
  ): string | null {
    if (
      !balances[sku] ||
      !locationValid(area) ||
      !positive(quantity)
    ) {
      return "Choose a product and a positive whole quantity.";
    }

    if (quantity > balances[sku][area]) {
      return "Insufficient stock at the source location.";
    }

    const updated = structuredClone(balances);

    updated[sku][area] -= quantity;

    save(
      "loss",
      sku,
      quantity,
      area,
      null,
      [reason, note.trim()]
        .filter(Boolean)
        .join(" — "),
      updated
    );

    return null;
  }

  function countStock(
    sku: string,
    area: Area,
    counted: number,
    note: string
  ): string | null {
    if (
      !balances[sku] ||
      !locationValid(area) ||
      !Number.isSafeInteger(counted) ||
      counted < 0
    ) {
      return "Enter a valid physical count.";
    }

    const previous = balances[sku][area];

    if (counted === previous) {
      return "Physical count matches recorded stock. No adjustment needed.";
    }

    const updated = structuredClone(balances);

    updated[sku][area] = counted;

    save(
      "count",
      sku,
      Math.abs(counted - previous),
      counted < previous ? area : null,
      counted > previous ? area : null,
      `Unexplained inventory difference${note.trim() ? ` — ${note.trim()}` : ""
      }`,
      updated,
      previous,
      counted
    );

    return null;
  }

  const api = useMemo(
    () => ({
      balances,
      operations,
      items: demoItems,
      register,
      reportLoss,
      countStock,
    }),
    [balances, operations, nextId]
  );

  return (
    <Context.Provider value={api}>
      {children}
    </Context.Provider>
  );
}

export function useOperations() {
  const context = useContext(Context);

  if (!context) {
    throw new Error("Missing OperationsProvider");
  }

  return context;
}

export function itemLabel(item: Item) {
  return `${item.name} · ${item.variant} · ${item.sku}`;
}

export function matchesItem(
  item: Item,
  search: string
) {
  return [
    item.name,
    item.variant,
    item.sku,
    item.barcode,
    item.category,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search.toLowerCase().trim());
}
