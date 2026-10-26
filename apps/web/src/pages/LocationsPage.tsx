import ChopsSelect from "../components/ChopsSelect";
import { useLanguage } from "../i18n/LanguageContext";

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react'

type Branch = {
  id: number
  name: string
  address: string
  active: boolean
}

type StorageLocation = {
  id: number
  name: string
  description: string
  type: 'exhibition' | 'warehouse'
  branchId: number | null
  active: boolean
}

const initialBranches: Branch[] = [
  {
    id: 1,
    name: 'Main Store',
    address: 'Lima, Peru',
    active: true,
  },
]

const initialLocations: StorageLocation[] = [
  {
    id: 1,
    name: 'Exhibition',
    description: 'Products displayed for customers',
    type: 'exhibition',
    branchId: 1,
    active: true,
  },
  {
    id: 2,
    name: 'Warehouse',
    description: 'Reserve inventory',
    type: 'warehouse',
    branchId: 1,
    active: true,
  },
]

function nextId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

export default function LocationsPage() {
  const { t, language } = useLanguage();
  const [branches, setBranches] = useState(initialBranches)
  const [locations, setLocations] = useState(initialLocations)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'branches' | 'locations'>('branches')

  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [editingLocation, setEditingLocation] =
    useState<StorageLocation | null>(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase()

    return branches.filter((branch) =>
      `${branch.name} ${branch.address}`.toLowerCase().includes(query),
    )
  }, [branches, search])

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return locations.filter((location) => {
      const branchName =
        branches.find((branch) => branch.id === location.branchId)?.name ??
        t('Central / Independent')

      return [
        location.name,
        location.description,
        location.type,
        branchName,
      ].join(' ').toLowerCase().includes(query)
    })
  }, [locations, branches, search])

  function openBranch(branch?: Branch) {
    setEditingBranch(
      branch
        ? { ...branch }
        : {
          id: 0,
          name: '',
          address: '',
          active: true,
        },
    )

    setError('')
    setNotice('')
  }

  function openLocation(location?: StorageLocation) {
    setEditingLocation(
      location
        ? { ...location }
        : {
          id: 0,
          name: '',
          description: '',
          type: 'warehouse',
          branchId: branches[0]?.id ?? null,
          active: true,
        },
    )

    setError('')
    setNotice('')
  }

  function saveBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingBranch) return

    const name = editingBranch.name.trim()
    const address = editingBranch.address.trim()

    if (!name || !address) {
      setError('Name and address are required.')
      return
    }

    if (
      branches.some(
        (branch) =>
          branch.id !== editingBranch.id &&
          branch.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError('A branch with this name already exists.')
      return
    }

    if (editingBranch.id === 0) {
      const branchId = nextId(branches)
      const locationId = nextId(locations)

      setBranches((current) => [
        ...current,
        {
          ...editingBranch,
          id: branchId,
          name,
          address,
        },
      ])

      setLocations((current) => [
        ...current,
        {
          id: locationId,
          name: 'Exhibition',
          description: 'Products displayed for customers',
          type: 'exhibition',
          branchId,
          active: true,
        },
        {
          id: locationId + 1,
          name: 'Warehouse',
          description: 'Reserve inventory',
          type: 'warehouse',
          branchId,
          active: true,
        },
      ])
    } else {
      setBranches((current) =>
        current.map((branch) =>
          branch.id === editingBranch.id
            ? { ...editingBranch, name, address }
            : branch,
        ),
      )
    }

    setEditingBranch(null)
    setError('')
    setNotice('Branch saved successfully.')
  }

  function hasRequiredLocations(
    branchId: number,
    candidateLocations: StorageLocation[],
  ) {
    return (
      candidateLocations.some(
        (location) =>
          location.branchId === branchId &&
          location.type === 'exhibition' &&
          location.active,
      ) &&
      candidateLocations.some(
        (location) =>
          location.branchId === branchId &&
          location.type === 'warehouse' &&
          location.active,
      )
    )
  }

  function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingLocation) return

    const name = editingLocation.name.trim()
    const description = editingLocation.description.trim()

    if (!name) {
      setError('Location name is required.')
      return
    }

    if (
      editingLocation.type === 'exhibition' &&
      editingLocation.branchId === null
    ) {
      setError('Exhibition must belong to a branch.')
      return
    }

    if (
      editingLocation.branchId !== null &&
      !branches.some((branch) => branch.id === editingLocation.branchId)
    ) {
      setError('Select a valid branch.')
      return
    }

    if (
      locations.some(
        (location) =>
          location.id !== editingLocation.id &&
          location.branchId === editingLocation.branchId &&
          location.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError('This location name already exists in the selected branch.')
      return
    }

    const savedLocation: StorageLocation = {
      ...editingLocation,
      name,
      description,
    }

    if (editingLocation.id === 0) {
      setLocations((current) => [
        ...current,
        {
          ...savedLocation,
          id: nextId(current),
        },
      ])
    } else {
      const candidateLocations = locations.map((location) =>
        location.id === editingLocation.id ? savedLocation : location,
      )

      const affectedBranchIds = new Set(
        [locations.find((location) =>
          location.id === editingLocation.id,
        )?.branchId, editingLocation.branchId].filter(
          (id): id is number => id !== null && id !== undefined,
        ),
      )

      for (const branchId of affectedBranchIds) {
        if (!hasRequiredLocations(branchId, candidateLocations)) {
          setError('Each branch must retain an active exhibition and warehouse.')
          return
        }
      }

      setLocations(candidateLocations)
    }

    setEditingLocation(null)
    setError('')
    setNotice('Location saved successfully.')
  }

  function deleteLocation(location: StorageLocation) {
    setNotice('')

    const candidateLocations = locations.filter(
      (item) => item.id !== location.id,
    )

    if (
      location.branchId !== null &&
      !hasRequiredLocations(location.branchId, candidateLocations)
    ) {
      window.alert(t('Cannot delete this location. Each branch must retain an active exhibition and warehouse.'))
      return
    }

    const confirmed = window.confirm(
      language === "es" ? `¿Seguro que deseas eliminar "${location.name}"?` : `Are you sure you want to delete "${location.name}"?`,
    )

    if (!confirmed) return

    setLocations(candidateLocations)
    setNotice(language === "es" ? `Ubicación "${location.name}" eliminada correctamente.` : `Location "${location.name}" deleted successfully.`)
  }

  return (
    <section className="locations-page">
      <div className="page-title">
        <div>
          <h2>{t('Locations')}</h2>
          <p>{t('Manage branches and inventory storage locations.')}</p>
        </div>
        <span className="badge badge-info">{t('Demo Data')}</span>
      </div>

      <div className="location-summary">
        <article className="stat">
          <Store size={18} className="stat-icon" />
          <div className="stat-label">{t('Branches')}</div>
          <div className="stat-value">{branches.length}</div>
        </article>

        <article className="stat">
          <Warehouse size={18} className="stat-icon" />
          <div className="stat-label">{t('Storage Locations')}</div>
          <div className="stat-value">{locations.length}</div>
        </article>
      </div>

      <div className="location-tabs" role="tablist" aria-label={t('Location views')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'branches'}
          className={
            tab === 'branches' ? 'location-tab active' : 'location-tab'
          }
          onClick={() => {
            setTab('branches')
            setSearch('')
            setNotice('')
          }}
        >
          <Building2 size={16} />{t('Branches')}</button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'locations'}
          className={
            tab === 'locations' ? 'location-tab active' : 'location-tab'
          }
          onClick={() => {
            setTab('locations')
            setSearch('')
            setNotice('')
          }}
        >
          <Warehouse size={16} />{t('Storage Locations')}</button>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={t('Search locations')}
            placeholder={
              tab === 'branches'
                ? t('Search branches...')
                : t('Search storage locations...')
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            tab === 'branches' ? openBranch() : openLocation()
          }
        >
          <Plus size={17} />
          {t(tab === 'branches' ? 'Add Branch' : 'Add Location')}
        </button>
      </div>

      {notice && (
        <p className="location-notice" role="status">
          {t(notice)}
        </p>
      )}

      {tab === 'branches' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('Branch')}</th>
                <th>{t('Address')}</th>
                <th>{t('Locations')}</th>
                <th>{t('Status')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>

            <tbody>
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
                      className={`badge ${branch.active
                          ? 'badge-success'
                          : 'badge-warning'
                        }`}
                    >
                      {t(branch.active ? 'Active' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => openBranch(branch)}
                    >
                      <Pencil size={15} />{t('Edit')}</button>
                  </td>
                </tr>
              ))}

              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan={5} className="products-empty">{t('No branches found.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('Location')}</th>
                <th>{t('Type')}</th>
                <th>{t('Branch')}</th>
                <th>{t('Description')}</th>
                <th>{t('Status')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>

            <tbody>
              {filteredLocations.map((location) => (
                <tr key={location.id}>
                  <td>
                    <strong>{location.name}</strong>
                  </td>

                  <td>
                    <span className="location-type">
                      {location.type === 'exhibition' ? (
                        <Store size={15} />
                      ) : (
                        <Warehouse size={15} />
                      )}
                      {location.type === 'exhibition'
                        ? t('Exhibition')
                        : t('Warehouse')}
                    </span>
                  </td>

                  <td>
                    {branches.find(
                      (branch) => branch.id === location.branchId,
                    )?.name ?? t('Central / Independent')}
                  </td>

                  <td>{location.description || '—'}</td>

                  <td>
                    <span
                      className={`badge ${location.active
                          ? 'badge-success'
                          : 'badge-warning'
                        }`}
                    >
                      {t(location.active ? 'Active' : 'Inactive')}
                    </span>
                  </td>

                  <td>
                    <div className="location-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openLocation(location)}
                      >
                        <Pencil size={15} />{t('Edit')}</button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => deleteLocation(location)}
                      >
                        <Trash2 size={15} />{t('Delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={6} className="products-empty">{t('No storage locations found.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="products-note">{t('Demo data. Changes reset when the page is reloaded.')}</p>

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
                {t(editingBranch.id === 0 ? 'Add Branch' : 'Edit Branch')}
              </h3>

              <button
                type="button"
                className="product-icon-button"
                aria-label={t('Close form')}
                onClick={() => setEditingBranch(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveBranch}>
              <div className="field">
                <label htmlFor="branch-name">{t('Branch Name')}</label>
                <input
                  id="branch-name"
                  required
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
                <label htmlFor="branch-address">{t('Address')}</label>
                <input
                  id="branch-address"
                  required
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
                <label htmlFor="branch-status">{t('Status')}</label>
                <ChopsSelect
                  id="branch-status"
                  ariaLabel={t('Status')}
                  value={editingBranch.active ? 'active' : 'inactive'}
                  options={[{ value: 'active', label: t('Active') }, { value: 'inactive', label: t('Inactive') }]}
                  onChange={(next) => setEditingBranch({ ...editingBranch, active: next === 'active' })}
                />
              </div>

              {editingBranch.id === 0 && (
                <p className="location-hint">
                  <MapPin size={15} />{t('Exhibition and Warehouse will be created automatically.')}</p>
              )}

              {error && (
                <p className="product-form-error" role="alert">
                  {t(error)}
                </p>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingBranch(null)}
                >{t('Cancel')}</button>

                <button type="submit" className="btn btn-primary">{t('Save Branch')}</button>
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
                {t(editingLocation.id === 0
                  ? 'Add Location'
                  : 'Edit Location')}
              </h3>

              <button
                type="button"
                className="product-icon-button"
                aria-label={t('Close form')}
                onClick={() => setEditingLocation(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveLocation}>
              <div className="field">
                <label htmlFor="location-name">{t('Location Name')}</label>
                <input
                  id="location-name"
                  required
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
                <label htmlFor="location-description">{t('Description')}</label>
                <input
                  id="location-description"
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
                <label htmlFor="location-type">{t('Location Type')}</label>
                <ChopsSelect
                  id="location-type"
                  ariaLabel={t('Location Type')}
                  value={editingLocation.type}
                  options={[{ value: 'exhibition', label: t('Exhibition') }, { value: 'warehouse', label: t('Warehouse') }]}
                  onChange={(next) => setEditingLocation({
                    ...editingLocation,
                    type: next as StorageLocation['type'],
                    branchId: next === 'exhibition' ? editingLocation.branchId ?? branches[0]?.id ?? null : editingLocation.branchId,
                  })}
                />
              </div>

              <div className="field">
                <label htmlFor="location-branch">{t('Branch')}</label>
                <ChopsSelect
                  id="location-branch"
                  ariaLabel={t('Branch')}
                  value={String(editingLocation.branchId ?? '')}
                  options={[
                    ...(editingLocation.type === 'warehouse' ? [{ value: '', label: t('Central / Independent') }] : []),
                    ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
                  ]}
                  onChange={(next) => setEditingLocation({
                    ...editingLocation,
                    branchId: next === '' ? null : Number(next),
                  })}
                />
              </div>

              <div className="field">
                <label htmlFor="location-status">{t('Status')}</label>
                <ChopsSelect
                  id="location-status"
                  ariaLabel={t('Status')}
                  value={editingLocation.active ? 'active' : 'inactive'}
                  options={[{ value: 'active', label: t('Active') }, { value: 'inactive', label: t('Inactive') }]}
                  onChange={(next) => setEditingLocation({ ...editingLocation, active: next === 'active' })}
                />
              </div>

              {error && (
                <p className="product-form-error" role="alert">
                  {t(error)}
                </p>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingLocation(null)}
                >{t('Cancel')}</button>

                <button type="submit" className="btn btn-primary">{t('Save Location')}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
