import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

test("Pages product and location clients keep demo writes within the local catalogs", async () => {
  const vite = await createServer({
    configFile: false,
    logLevel: "error",
    server: { middlewareMode: true, hmr: false },
    define: { "import.meta.env.PROD": "true", "import.meta.env.VITE_API_URL": '""' },
  });
  try {
    const products = await vite.ssrLoadModule("/src/api/products.ts");
    const locations = await vite.ssrLoadModule("/src/api/locations.ts");
    const item = { name: "Tea", category: "Drinks", price: 2, variants: [{ sku: "QA-TEA", name: "Cup" }] };
    const created = await products.createProduct(item);
    created.variants[0].name = "Modified copy";
    assert.equal((await products.listProducts()).find(p => p.id === created.id).variants[0].name, "Cup");
    assert.equal((await products.updateProduct(created.id, { ...item, price: 3 })).price, 3);
    await products.deleteProduct(created.id);
    assert.ok(!(await products.listProducts()).some(p => p.id === created.id));

    const branch = await locations.createBranch({ name: "Test branch", address: "Test", active: true });
    const defaults = (await locations.listLocations()).filter(location => location.branchId === branch.id);
    assert.deepEqual(defaults.map(location => location.type).sort(), ["exhibition", "warehouse"]);
    await assert.rejects(locations.deleteLocation(defaults[0].id), { status: 409 });
    const extra = await locations.createLocation({ name: "Annex", type: "warehouse", branchId: branch.id, active: true, description: "" });
    await locations.updateLocation(extra.id, { ...extra, name: "Annex 2" });
    await locations.deleteLocation(extra.id);
    await locations.updateBranch(branch.id, { ...branch, name: "Renamed" });
    await locations.deleteBranch(branch.id);
    assert.ok(!(await locations.listBranches()).some(b => b.id === branch.id));
    assert.ok(!(await locations.listLocations()).some(l => l.branchId === branch.id));
  } finally {
    await vite.close();
  }
});
