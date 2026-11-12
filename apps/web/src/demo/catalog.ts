// Single source of truth for the demo catalog and its starting stock.
// Used by the operations context and by the checkout demo.

export type Item = {
  sku: string;
  name: string;
  variant: string;
  barcode: string;
  category: string;
  cost: number;
  price: number;
};

export type Balance = {
  exhibition: number;
  warehouse: number;
};

export type InventoryState = Record<string, Balance>;

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

export const demoInitialBalances: InventoryState = {
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
