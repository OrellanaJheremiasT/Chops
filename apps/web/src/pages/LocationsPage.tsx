import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Store,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";

import ChopsSelect from "../components/ChopsSelect";
import { useAppDialog } from "../components/dialog/dialogContext";
import { useToast } from "../components/ToastStack";
import { useLanguage } from "../i18n/LanguageContext";
import { ApiError } from "../api/client";

import {
  createBranch,
  createLocation,
  deleteBranch,
  deleteLocation,
  listBranches,
  listLocations,
  locationsDemoMode,
  updateBranch,
  updateLocation,
} from "../api/locations";

import type {
  Branch,
  BranchInput,
  LocationType,
  StorageLocation,
  StorageLocationInput,
} from "../api/locations";

type Tab = "branches" | "locations";

function describeError(error: unknown, spanish: boolean): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return spanish
        ? "Conflicto: nombre duplicado o ubicación obligatoria."
        : "Conflict: duplicate name or required location.";
    }

    if (error.status === 400) {
      return spanish
        ? "Datos inválidos. Revisa el formulario."
        : "Invalid data. Check the form.";
    }

    if (error.status === 404) {
      return spanish
        ? "Sucursal o ubicación no encontrada."
        : "Branch or location not found.";
    }
  }

  return spanish
    ? "No se pudo completar la operación. Comprueba Spring Boot."
    : "Request failed. Check that Spring Boot is running.";
}

function retainsRequiredLocations(
  branchId: number,
  candidate: StorageLocation[],
): boolean {
  return (["exhibition", "warehouse"] as const).every((type) =>
    candidate.some(
      (location) =>
        location.branchId === branchId &&
        location.type === type &&
        location.active,
    ),
  );
}

export default function LocationsPage() {
  const { t, language } = useLanguage();
  const spanish = language === "es";
  const dialog = useAppDialog();
  const { notify } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("branches");

  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [editingLocation, setEditingLocation] =
    useState<StorageLocation | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      listBranches(controller.signal),
      listLocations(controller.signal),
    ])
      .then(([loadedBranches, loadedLocations]) => {
        if (controller.signal.aborted) return;

        setBranches(loadedBranches);
        setLocations(loadedLocations);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(describeError(cause, language === "es"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [language]);

  async function refreshData() {
    const [loadedBranches, loadedLocations] = await Promise.all([
      listBranches(),
      listLocations(),
    ]);

    setBranches(loadedBranches);
    setLocations(loadedLocations);
    setLoadError("");
  }

  async function reload() {
    if (loading || working) return;

    setLoading(true);
    setLoadError("");

    try {
      await refreshData();
    } catch (cause) {
      setLoadError(describeError(cause, spanish));
    } finally {
      setLoading(false);
    }
  }

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return branches.filter((branch) =>
      `${branch.name} ${branch.address}`.toLowerCase().includes(query),
    );
  }, [branches, search]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const branchName =
        branches.find((branch) => branch.id === location.branchId)?.name ??
        t("Central / Independent");

      return [location.name, location.description, location.type, branchName]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [locations, branches, search, t]);

  function openBranch(branch?: Branch) {
    setEditingBranch(
      branch
        ? { ...branch }
        : {
            id: 0,
            name: "",
            address: "",
            active: true,
          },
    );

    setError("");
    setNotice("");
  }

  function openLocation(location?: StorageLocation) {
    setEditingLocation(
      location
        ? { ...location }
        : {
            id: 0,
            name: "",
            description: "",
            type: "warehouse",
            branchId: branches[0]?.id ?? null,
            active: true,
          },
    );

    setError("");
    setNotice("");
  }

  async function saveBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBranch || working) return;

    const payload: BranchInput = {
      name: editingBranch.name.trim(),
      address: editingBranch.address.trim(),
      active: editingBranch.active,
    };

    if (!payload.name || !payload.address) {
      setError(t("Name and address are required."));
      return;
    }

    if (
      branches.some(
        (branch) =>
          branch.id !== editingBranch.id &&
          branch.name.toLowerCase() === payload.name.toLowerCase(),
      )
    ) {
      setError(t("A branch with this name already exists."));
      return;
    }

    setWorking(true);
    setError("");

    try {
      if (editingBranch.id === 0) {
        await createBranch(payload);
      } else {
        await updateBranch(editingBranch.id, payload);
      }

      setEditingBranch(null);
      setNotice(t("Branch saved successfully."));
      notify(t("Branch saved successfully."), "success");

      try {
        await refreshData();
      } catch (cause) {
        setLoadError(describeError(cause, spanish));
      }
    } catch (cause) {
      setError(describeError(cause, spanish));
    } finally {
      setWorking(false);
    }
  }

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLocation || working) return;

    const payload: StorageLocationInput = {
      name: editingLocation.name.trim(),
      description: editingLocation.description.trim(),
      type: editingLocation.type,
      branchId: editingLocation.branchId,
      active: editingLocation.active,
    };

    if (!payload.name) {
      setError(t("Location name is required."));
      return;
    }

    if (payload.type === "exhibition" && payload.branchId === null) {
      setError(t("Exhibition must belong to a branch."));
      return;
    }

    if (
      payload.branchId !== null &&
      !branches.some((branch) => branch.id === payload.branchId)
    ) {
      setError(t("Select a valid branch."));
      return;
    }

    if (
      locations.some(
        (location) =>
          location.id !== editingLocation.id &&
          location.branchId === payload.branchId &&
          location.name.toLowerCase() === payload.name.toLowerCase(),
      )
    ) {
      setError(t("This location name already exists in the selected branch."));
      return;
    }

    if (editingLocation.id !== 0) {
      const updated = { ...editingLocation, ...payload };

      const candidate = locations.map((location) =>
        location.id === editingLocation.id ? updated : location,
      );

      const previous = locations.find(
        (location) => location.id === editingLocation.id,
      );

      const branchIds = [previous?.branchId, payload.branchId].filter(
        (id): id is number => id !== null && id !== undefined,
      );

      if (branchIds.some((id) => !retainsRequiredLocations(id, candidate))) {
        setError(
          t("Each branch must retain an active exhibition and warehouse."),
        );
        return;
      }
    }

    setWorking(true);
    setError("");

    try {
      if (editingLocation.id === 0) {
        await createLocation(payload);
      } else {
        await updateLocation(editingLocation.id, payload);
      }

      setEditingLocation(null);
      setNotice(t("Location saved successfully."));
      notify(t("Location saved successfully."), "success");

      try {
        await refreshData();
      } catch (cause) {
        setLoadError(describeError(cause, spanish));
      }
    } catch (cause) {
      setError(describeError(cause, spanish));
    } finally {
      setWorking(false);
    }
  }

  async function requestDeleteBranch(branch: Branch) {
    if (working) return;

    const locationCount = locations.filter(
      (location) => location.branchId === branch.id,
    ).length;

    const accepted = await dialog.confirm({
      title: spanish ? "¿Eliminar sucursal?" : "Delete branch?",
      message: spanish
        ? `¿Eliminar la sucursal "${branch.name}" y sus ${locationCount} ubicaciones? Esta acción no se puede deshacer.`
        : `Delete branch "${branch.name}" and its ${locationCount} locations? This action cannot be undone.`,
      confirmLabel: spanish ? "Eliminar" : "Delete",
      cancelLabel: t("Cancel"),
      closeLabel: spanish ? "Cerrar" : "Close",
      tone: "danger",
    });
    if (!accepted || working) return;

    setWorking(true);
    setNotice("");
    setLoadError("");
    try {
      await deleteBranch(branch.id);
      notify(
        spanish ? `Sucursal "${branch.name}" eliminada.` : `Branch "${branch.name}" deleted.`,
        "success",
      );
      await refreshData();
    } catch (cause) {
      const message = describeError(cause, spanish);
      setLoadError(message);
      notify(message, "error");
    } finally {
      setWorking(false);
    }
  }

  async function requestDeleteLocation(location: StorageLocation) {
    if (working) return;

    const candidate = locations.filter((item) => item.id !== location.id);
    if (
      location.branchId !== null &&
      !retainsRequiredLocations(location.branchId, candidate)
    ) {
      await dialog.alert({
        title: spanish ? "Acción no permitida" : "Action not allowed",
        message: t(
          "Cannot delete this location. Each branch must retain an active exhibition and warehouse.",
        ),
        confirmLabel: spanish ? "Entendido" : "Got it",
        closeLabel: spanish ? "Cerrar" : "Close",
        tone: "warning",
      });
      return;
    }

    const accepted = await dialog.confirm({
      title: spanish ? "¿Eliminar ubicación?" : "Delete location?",
      message: spanish
        ? `¿Eliminar la ubicación "${location.name}"? Esta acción no se puede deshacer.`
        : `Delete location "${location.name}"? This action cannot be undone.`,
      confirmLabel: spanish ? "Eliminar" : "Delete",
      cancelLabel: t("Cancel"),
      closeLabel: spanish ? "Cerrar" : "Close",
      tone: "danger",
    });
    if (!accepted || working) return;

    setWorking(true);
    setNotice("");
    setLoadError("");
    try {
      await deleteLocation(location.id);
      notify(
        spanish ? `Ubicación "${location.name}" eliminada.` : `Location "${location.name}" deleted.`,
        "success",
      );
      await refreshData();
    } catch (cause) {
      const message = describeError(cause, spanish);
      setLoadError(message);
      notify(message, "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <section className="locations-page">
        <div className="page-title">
          <div>
            <h2>{t("Locations")}</h2>
            <p>{t("Manage branches and inventory storage locations.")}</p>
          </div>

          <span className="badge badge-info">
            {locationsDemoMode
              ? t("Demo Data")
              : spanish
                ? "Datos API"
                : "API Data"}
          </span>
        </div>

        <div className="location-summary">
          <article className="stat">
            <Store size={18} className="stat-icon" />
            <div className="stat-label">{t("Branches")}</div>
            <div className="stat-value">{branches.length}</div>
          </article>

          <article className="stat">
            <Warehouse size={18} className="stat-icon" />
            <div className="stat-label">{t("Storage Locations")}</div>
            <div className="stat-value">{locations.length}</div>
          </article>
        </div>

        <div
          className="location-tabs"
          role="tablist"
          aria-label={t("Location views")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "branches"}
            className={
              tab === "branches" ? "location-tab active" : "location-tab"
            }
            onClick={() => {
              setTab("branches");
              setSearch("");
              setNotice("");
            }}
          >
            <Building2 size={16} />
            {t("Branches")}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "locations"}
            className={
              tab === "locations" ? "location-tab active" : "location-tab"
            }
            onClick={() => {
              setTab("locations");
              setSearch("");
              setNotice("");
            }}
          >
            <Warehouse size={16} />
            {t("Storage Locations")}
          </button>
        </div>

        <div className="products-toolbar">
          <div className="products-search">
            <Search size={17} aria-hidden="true" />

            <input
              aria-label={t("Search locations")}
              placeholder={
                tab === "branches"
                  ? t("Search branches...")
                  : t("Search storage locations...")
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading || working}
            onClick={reload}
          >
            <RefreshCcw size={16} />
            {spanish ? "Actualizar" : "Refresh"}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || working || Boolean(loadError)}
            onClick={() => (tab === "branches" ? openBranch() : openLocation())}
          >
            <Plus size={17} />
            {t(tab === "branches" ? "Add Branch" : "Add Location")}
          </button>
        </div>

        {notice && (
          <p className="location-notice" role="status">
            {notice}
          </p>
        )}

        {loadError && (
          <p className="product-form-error" role="alert">
            {loadError}
          </p>
        )}

        {tab === "branches" ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Branch")}</th>
                  <th>{t("Address")}</th>
                  <th>{t("Locations")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="products-empty">
                      {spanish ? "Cargando..." : "Loading..."}
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={5} className="products-empty">
                      {spanish
                        ? "No se pudo cargar. Pulsa Actualizar."
                        : "Could not load data. Click Refresh."}
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredBranches.map((branch) => (
                      <tr key={branch.id}>
                        <td>
                          <strong>{branch.name}</strong>
                        </td>

                        <td>{branch.address}</td>

                        <td>
                          {
                            locations.filter(
                              (location) => location.branchId === branch.id,
                            ).length
                          }
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              branch.active ? "badge-success" : "badge-warning"
                            }`}
                          >
                            {t(branch.active ? "Active" : "Inactive")}
                          </span>
                        </td>

                        <td>
                          <div className="location-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={working}
                              onClick={() => openBranch(branch)}
                            >
                              <Pencil size={15} />
                              {t("Edit")}
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={working}
                              onClick={() => requestDeleteBranch(branch)}
                            >
                              <Trash2 size={15} />
                              {t("Delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredBranches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="products-empty">
                          {t("No branches found.")}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Location")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Branch")}</th>
                  <th>{t("Description")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="products-empty">
                      {spanish ? "Cargando..." : "Loading..."}
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="products-empty">
                      {spanish
                        ? "No se pudo cargar. Pulsa Actualizar."
                        : "Could not load data. Click Refresh."}
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredLocations.map((location) => (
                      <tr key={location.id}>
                        <td>
                          <strong>{location.name}</strong>
                        </td>

                        <td>
                          <span className="location-type">
                            {location.type === "exhibition" ? (
                              <Store size={15} />
                            ) : (
                              <Warehouse size={15} />
                            )}

                            {t(
                              location.type === "exhibition"
                                ? "Exhibition"
                                : "Warehouse",
                            )}
                          </span>
                        </td>

                        <td>
                          {branches.find(
                            (branch) => branch.id === location.branchId,
                          )?.name ?? t("Central / Independent")}
                        </td>

                        <td>{location.description || "—"}</td>

                        <td>
                          <span
                            className={`badge ${
                              location.active
                                ? "badge-success"
                                : "badge-warning"
                            }`}
                          >
                            {t(location.active ? "Active" : "Inactive")}
                          </span>
                        </td>

                        <td>
                          <div className="location-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={working}
                              onClick={() => openLocation(location)}
                            >
                              <Pencil size={15} />
                              {t("Edit")}
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={working}
                              onClick={() => requestDeleteLocation(location)}
                            >
                              <Trash2 size={15} />
                              {t("Delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredLocations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="products-empty">
                          {t("No storage locations found.")}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="products-note">
          {locationsDemoMode
            ? t("Demo data. Changes reset when the page is reloaded.")
            : spanish
              ? "Los datos se guardan temporalmente en Spring Boot. Inventory aún no está conectado a estas ubicaciones."
              : "Data is stored temporarily in Spring Boot. Inventory is not connected to these locations yet."}
        </p>

        {editingBranch && (
          <div className="product-modal-backdrop">
            <section
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="branch-form-title"
            >
              <div className="product-modal-header">
                <h3 id="branch-form-title">
                  {t(editingBranch.id === 0 ? "Add Branch" : "Edit Branch")}
                </h3>

                <button
                  type="button"
                  className="product-icon-button"
                  disabled={working}
                  aria-label={t("Close form")}
                  onClick={() => setEditingBranch(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveBranch}>
                <div className="field">
                  <label htmlFor="branch-name">{t("Branch Name")}</label>

                  <input
                    id="branch-name"
                    required
                    maxLength={120}
                    disabled={working}
                    value={editingBranch.name}
                    onChange={(event) =>
                      setEditingBranch({
                        ...editingBranch,
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="branch-address">{t("Address")}</label>

                  <input
                    id="branch-address"
                    required
                    maxLength={240}
                    disabled={working}
                    value={editingBranch.address}
                    onChange={(event) =>
                      setEditingBranch({
                        ...editingBranch,
                        address: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="branch-status">{t("Status")}</label>

                  <ChopsSelect
                    id="branch-status"
                    ariaLabel={t("Status")}
                    value={editingBranch.active ? "active" : "inactive"}
                    options={[
                      {
                        value: "active",
                        label: t("Active"),
                      },
                      {
                        value: "inactive",
                        label: t("Inactive"),
                      },
                    ]}
                    onChange={(next) =>
                      setEditingBranch({
                        ...editingBranch,
                        active: next === "active",
                      })
                    }
                  />
                </div>

                {editingBranch.id === 0 && (
                  <p className="location-hint">
                    <MapPin size={15} />
                    {t(
                      "Exhibition and Warehouse will be created automatically.",
                    )}
                  </p>
                )}

                {error && (
                  <p className="product-form-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="product-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={working}
                    onClick={() => setEditingBranch(null)}
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
                        ? "Guardando..."
                        : "Saving..."
                      : t("Save Branch")}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {editingLocation && (
          <div className="product-modal-backdrop">
            <section
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-form-title"
            >
              <div className="product-modal-header">
                <h3 id="location-form-title">
                  {t(
                    editingLocation.id === 0 ? "Add Location" : "Edit Location",
                  )}
                </h3>

                <button
                  type="button"
                  className="product-icon-button"
                  disabled={working}
                  aria-label={t("Close form")}
                  onClick={() => setEditingLocation(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveLocation}>
                <div className="field">
                  <label htmlFor="location-name">{t("Location Name")}</label>

                  <input
                    id="location-name"
                    required
                    maxLength={120}
                    disabled={working}
                    value={editingLocation.name}
                    onChange={(event) =>
                      setEditingLocation({
                        ...editingLocation,
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="location-description">
                    {t("Description")}
                  </label>

                  <input
                    id="location-description"
                    maxLength={240}
                    disabled={working}
                    value={editingLocation.description}
                    onChange={(event) =>
                      setEditingLocation({
                        ...editingLocation,
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="location-type">{t("Location Type")}</label>

                  <ChopsSelect
                    id="location-type"
                    ariaLabel={t("Location Type")}
                    value={editingLocation.type}
                    options={[
                      {
                        value: "exhibition",
                        label: t("Exhibition"),
                      },
                      {
                        value: "warehouse",
                        label: t("Warehouse"),
                      },
                    ]}
                    onChange={(next) =>
                      setEditingLocation({
                        ...editingLocation,
                        type: next as LocationType,
                        branchId:
                          next === "exhibition"
                            ? (editingLocation.branchId ??
                              branches[0]?.id ??
                              null)
                            : editingLocation.branchId,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="location-branch">{t("Branch")}</label>

                  <ChopsSelect
                    id="location-branch"
                    ariaLabel={t("Branch")}
                    value={String(editingLocation.branchId ?? "")}
                    options={[
                      ...(editingLocation.type === "warehouse"
                        ? [
                            {
                              value: "",
                              label: t("Central / Independent"),
                            },
                          ]
                        : []),
                      ...branches.map((branch) => ({
                        value: String(branch.id),
                        label: branch.name,
                      })),
                    ]}
                    onChange={(next) =>
                      setEditingLocation({
                        ...editingLocation,
                        branchId: next === "" ? null : Number(next),
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="location-status">{t("Status")}</label>

                  <ChopsSelect
                    id="location-status"
                    ariaLabel={t("Status")}
                    value={editingLocation.active ? "active" : "inactive"}
                    options={[
                      {
                        value: "active",
                        label: t("Active"),
                      },
                      {
                        value: "inactive",
                        label: t("Inactive"),
                      },
                    ]}
                    onChange={(next) =>
                      setEditingLocation({
                        ...editingLocation,
                        active: next === "active",
                      })
                    }
                  />
                </div>

                {error && (
                  <p className="product-form-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="product-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={working}
                    onClick={() => setEditingLocation(null)}
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
                        ? "Guardando..."
                        : "Saving..."
                      : t("Save Location")}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>

    </>
  );
}
