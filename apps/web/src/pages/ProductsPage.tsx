import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { useLanguage } from "../i18n/languageHook";
import { ApiError } from "../api/client";
import { useAppDialog } from "../components/dialog/dialogContext";
import { useToast } from "../components/toastContext";
import {
  createProduct,
  deleteProduct,
  listProducts,
  productsDemoMode,
  updateProduct,
} from "../api/products";
import type { Product, ProductInput, ProductVariant } from "../api/products";

type ProductDraft = ProductInput & { id: number | null };

function blankProduct(): ProductDraft {
  return {
    id: null,
    name: "",
    category: "",
    price: 0,
    variants: [{ sku: "", name: "" }],
  };
}

function errorMessage(error: unknown, spanish: boolean): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return spanish
        ? "El SKU ya existe en el catálogo."
        : "This SKU already exists in the catalog.";
    }
    if (error.status === 400) {
      return spanish
        ? "Datos inválidos. Revisa el formulario."
        : "Invalid data. Check the form.";
    }
    if (error.status === 404) {
      return spanish
        ? "El producto ya no existe. Actualiza el catálogo."
        : "The product no longer exists. Refresh the catalog.";
    }
  }

  return spanish
    ? "No se pudo completar la solicitud. Comprueba que Spring Boot esté encendido."
    : "Request failed. Make sure the Spring Boot API is running.";
}

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const spanish = language === "es";
  const dialog = useAppDialog();
  const { notify } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    listProducts(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setProducts(items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function reloadProducts() {
    setLoading(true);
    setLoadError(null);

    try {
      setProducts(await listProducts());
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(query),
        ),
    );
  }, [products, search]);

  function openCreate() {
    setEditing(blankProduct());
    setFormError("");
  }

  function openEdit(product: Product) {
    setEditing({
      ...product,
      variants: product.variants.map((variant) => ({ ...variant })),
    });
    setFormError("");
  }

  function updateVariant(
    index: number,
    field: keyof ProductVariant,
    value: string,
  ) {
    setEditing((current) => {
      if (!current) return null;

      return {
        ...current,
        variants: current.variants.map((variant, position) =>
          position === index ? { ...variant, [field]: value } : variant,
        ),
      };
    });
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || working) return;

    const payload: ProductInput = {
      name: editing.name.trim(),
      category: editing.category.trim(),
      price: editing.price,
      variants: editing.variants.map((variant) => ({
        sku: variant.sku.trim().toUpperCase(),
        name: variant.name.trim(),
      })),
    };

    if (
      !payload.name ||
      !payload.category ||
      payload.variants.length === 0 ||
      payload.variants.some((variant) => !variant.sku || !variant.name)
    ) {
      setFormError(t("Complete all required fields."));
      return;
    }

    if (
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      Math.abs(payload.price * 100 - Math.round(payload.price * 100)) > 1e-6
    ) {
      setFormError(
        spanish
          ? "El precio debe ser válido, no negativo y tener máximo 2 decimales."
          : "Price must be non-negative with up to 2 decimal places.",
      );
      return;
    }

    const skus = payload.variants.map((variant) => variant.sku);
    const otherSkus = products
      .filter((item) => item.id !== editing.id)
      .flatMap((item) => item.variants.map((variant) => variant.sku));

    if (
      new Set(skus).size !== skus.length ||
      skus.some((sku) => otherSkus.includes(sku))
    ) {
      setFormError(t("Each SKU must be unique."));
      return;
    }

    setWorking(true);
    setFormError("");

    try {
      if (editing.id === null) {
        const created = await createProduct(payload);
        setProducts((current) => [...current, created]);
      } else {
        const updated = await updateProduct(editing.id, payload);
        setProducts((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      setEditing(null);
      notify(spanish ? "Producto guardado correctamente." : "Product saved successfully.", "success");
    } catch (error) {
      setFormError(errorMessage(error, spanish));
    } finally {
      setWorking(false);
    }
  }

  async function removeProduct(product: Product) {
    if (working) return;
    const confirmed = await dialog.confirm({
      title: spanish ? "¿Eliminar producto?" : "Delete product?",
      message: spanish
        ? `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`
        : `Delete "${product.name}"? This action cannot be undone.`,
      confirmLabel: spanish ? "Eliminar" : "Delete",
      cancelLabel: t("Cancel"),
      closeLabel: spanish ? "Cerrar" : "Close",
      tone: "danger",
    });

    if (!confirmed || working) return;

    setWorking(true);
    setLoadError(null);

    try {
      await deleteProduct(product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      notify(spanish ? "Producto eliminado." : "Product deleted.", "success");
    } catch (error) {
      setLoadError(error);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="products-page">
      <div className="page-title">
        <div>
          <h2>{t("Products")}</h2>
          <p>{t("Manage your product catalog and SKU variants.")}</p>
        </div>

        <span className="badge badge-info">
          {productsDemoMode
            ? t("Demo Data")
            : spanish
              ? "API conectada"
              : "API data"}
        </span>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={t("Search products")}
            placeholder={t("Search by name, category or SKU...")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={reloadProducts}
          disabled={loading || working}
        >
          <RefreshCcw size={16} />
          {spanish ? "Actualizar" : "Refresh"}
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={loading || loadError !== null || working}
        >
          <Plus size={17} />
          {t("Add Product")}
        </button>
      </div>

      {loadError !== null && (
        <p className="product-form-error" role="alert">
          {errorMessage(loadError, spanish)}
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Product")}</th>
              <th>{t("Category")}</th>
              <th>{t("Variants / SKU")}</th>
              <th>{t("Price")}</th>
              <th>{t("Stock")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="products-empty">
                  {t("Loading…")}
                </td>
              </tr>
            )}

            {!loading &&
              loadError === null &&
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.category}</td>

                  <td>
                    <div className="product-variants">
                      {product.variants.map((variant) => (
                        <span key={variant.sku}>
                          {variant.name}: <code>{variant.sku}</code>
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>S/ {product.price.toFixed(2)}</td>

                  <td>
                    <span
                      className="badge badge-info"
                      title={
                        spanish
                          ? "El stock se conectará en la etapa de Inventory"
                          : "Stock will be connected during Inventory integration"
                      }
                    >
                      —
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={working}
                        onClick={() => openEdit(product)}
                        aria-label={`${t("Edit")} ${product.name}`}
                      >
                        <Pencil size={15} />
                        {t("Edit")}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={working}
                        onClick={() => removeProduct(product)}
                        aria-label={`${t("Delete")} ${product.name}`}
                      >
                        <Trash2 size={15} />
                        {t("Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading &&
              loadError === null &&
              filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="products-empty">
                    {t("No products found.")}
                  </td>
                </tr>
              )}

            {!loading && loadError !== null && (
              <tr>
                <td colSpan={6} className="products-empty">
                  {spanish
                    ? "No se pudo cargar el catálogo. Usa Actualizar para reintentar."
                    : "Could not load catalog. Use Refresh to retry."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="products-note">
        {productsDemoMode
          ? t("Demo catalog. Changes are temporary and reset on page reload.")
          : spanish
            ? "Catálogo almacenado temporalmente en Spring Boot: se reinicia al apagar la API. Las existencias se conectarán desde Inventory."
            : "Catalog stored temporarily in Spring Boot: data resets when the API restarts. Stock will be connected through Inventory."}
      </p>

      {editing && (
        <div className="product-modal-backdrop">
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="product-modal-header">
              <h3 id="product-form-title">
                {editing.id === null ? t("Add Product") : t("Edit Product")}
              </h3>

              <button
                type="button"
                className="product-icon-button"
                disabled={working}
                onClick={() => setEditing(null)}
                aria-label={t("Close form")}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="field">
                <label htmlFor="product-name">{t("Product Name")}</label>
                <input
                  id="product-name"
                  maxLength={150}
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                  disabled={working}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-category">{t("Category")}</label>
                <input
                  id="product-category"
                  maxLength={100}
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                  disabled={working}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="product-price">{t("Base Price (S/)")}</label>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      price: Number(event.target.value),
                    })
                  }
                  disabled={working}
                  required
                />
              </div>

              <div className="product-variant-heading">
                <h4>{t("Variants")}</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={working || editing.variants.length >= 100}
                  onClick={() =>
                    setEditing({
                      ...editing,
                      variants: [...editing.variants, { sku: "", name: "" }],
                    })
                  }
                >
                  <Plus size={15} />
                  {t("Add Variant")}
                </button>
              </div>

              {editing.variants.map((variant, index) => (
                <div className="product-variant-editor" key={index}>
                  <div className="field">
                    <label htmlFor={`variant-name-${index}`}>
                      {t("Variant")}
                    </label>
                    <input
                      id={`variant-name-${index}`}
                      placeholder={t("e.g. 500 ml")}
                      maxLength={100}
                      value={variant.name}
                      onChange={(event) =>
                        updateVariant(index, "name", event.target.value)
                      }
                      disabled={working}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`variant-sku-${index}`}>SKU</label>
                    <input
                      id={`variant-sku-${index}`}
                      placeholder={t("e.g. BEV-COKE-500")}
                      maxLength={64}
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(index, "sku", event.target.value)
                      }
                      disabled={working}
                      required
                    />
                  </div>

                  {editing.variants.length > 1 && (
                    <button
                      type="button"
                      className="product-remove-variant"
                      disabled={working}
                      onClick={() =>
                        setEditing({
                          ...editing,
                          variants: editing.variants.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                    >
                      {t("Remove variant")}
                    </button>
                  )}
                </div>
              ))}

              {formError && (
                <p className="product-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={working}
                  onClick={() => setEditing(null)}
                >
                  {t("Cancel")}
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={working}
                >
                  {working
                    ? spanish
                      ? "Guardando…"
                      : "Saving…"
                    : t("Save Product")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
