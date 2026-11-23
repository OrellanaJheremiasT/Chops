// Exercise stock aggregation, demo movement invariants, and CSV handling without mounting the interface.
import assert from "node:assert/strict";
import test from "node:test";
import { buildStockRows } from "../src/features/inventory/stockRows.ts";
import { applyMovement } from "../src/demo/applyMovement.ts";
import { csvCell } from "../src/features/reports/exportFiles.ts";

const shop = { id: 1, type: "exhibition" };
const depot = { id: 2, type: "warehouse" };
const snapshot = {
  products: [{
    name: "Juice", category: "Drinks",
    variants: [{ sku: "ABC", name: "Small" }, { sku: "XYZ", name: "Large" }],
  }],
  locations: [shop, depot],
  balances: [
    { sku: "abc", locationId: 1, quantity: 8 },
    { sku: "ABC", locationId: 2, quantity: 13 },
  ],
};

test("balances follow branch and location filters, including empty variants", () => {
  const quantities = (visible, id) => buildStockRows(snapshot, visible, id)
    .map(({ exhibition, warehouse }) => [exhibition, warehouse]);
  assert.deepEqual(quantities([shop, depot], "all"), [[8, 13], [0, 0]]);
  assert.deepEqual(quantities([shop], "all"), [[8, 0], [0, 0]]);
  assert.deepEqual(quantities([shop, depot], "2"), [[0, 13], [0, 0]]);
  assert.deepEqual(buildStockRows(null, [], "all"), []);
  assert.deepEqual(buildStockRows({ ...snapshot, locations: [] }, [], "all"), []);
});

test("CSV preserves amounts, escapes quotes and protects formula-like cells", () => {
  assert.equal(csvCell(-1.25), '"-1.25"');
  assert.equal(csvCell('one,"two"'), '"one,""two"""');
  for (const cell of ["=total", "+total", "-total", "@total", "\tvalue", "\rvalue"]) {
    assert.equal(csvCell(cell), `"'${cell}"`);
  }
  assert.equal(csvCell(null), '""');
});

test("demo transfers conserve stock and reject invalid amounts before either balance changes", () => {
  const balances = { ABC: { exhibition: 6, warehouse: 3 } };
  const transfer = { kind: "transfer", sku: "ABC", from: "exhibition", to: "warehouse", quantity: 2 };
  assert.deepEqual(applyMovement(balances, transfer).updated.ABC, { exhibition: 4, warehouse: 5 });
  for (const quantity of [0, -1, 1.5, 7]) {
    assert.equal(typeof applyMovement(balances, { ...transfer, quantity }), "string");
  }
  assert.deepEqual(balances.ABC, { exhibition: 6, warehouse: 3 });
  const full = { ABC: { exhibition: 6, warehouse: Number.MAX_SAFE_INTEGER } };
  assert.equal(applyMovement(full, transfer), "Stock quantity limit exceeded.");
  assert.equal(full.ABC.exhibition, 6);
});
