import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

export type Language = "en" | "es"

const spanish: Record<string, string> = {
  'Dashboard': 'Panel de control',
  'Products': 'Productos',
  'Locations': 'Ubicaciones',
  'Inventory': 'Inventario',
  'Sales': 'Ventas',
  'Stock Movements': 'Movimientos de stock',
  'Page not found': 'Página no encontrada',
  'This section is under development.': 'Esta sección está en desarrollo.',
  'Switch to dark mode': 'Cambiar a modo oscuro',
  'Switch to light mode': 'Cambiar a modo claro',
  'Dark mode': 'Modo oscuro',
  'Light mode': 'Modo claro',
  'Overview of your business operations.': 'Resumen de las operaciones de tu negocio.',
  'Demo Data': 'Datos de prueba',
  'Low Stock': 'Stock bajo',
  'Transactions': 'Transacciones',
  'Recent Products': 'Productos recientes',
  'Available': 'Disponible',
  'Manage your product catalog and SKU variants.': 'Administra tu catálogo de productos y variantes SKU.',
  'Search products': 'Buscar productos',
  'Search by name, category or SKU...': 'Buscar por nombre, categoría o SKU...',
  'Add Product': 'Agregar producto',
  'Product': 'Producto',
  'Category': 'Categoría',
  'Variants / SKU': 'Variantes / SKU',
  'Price': 'Precio',
  'Stock': 'Stock',
  'Actions': 'Acciones',
  'Edit': 'Editar',
  'Delete': 'Eliminar',
  'No products found.': 'No se encontraron productos.',
  'Demo catalog. Changes are temporary and reset on page reload.': 'Catálogo de prueba. Los cambios son temporales y se restablecen al recargar.',
  'Edit Product': 'Editar producto',
  'Close form': 'Cerrar formulario',
  'Product Name': 'Nombre del producto',
  'Base Price (S/)': 'Precio base (S/)',
  'Variants': 'Variantes',
  'Add Variant': 'Agregar variante',
  'Variant': 'Variante',
  'Remove variant': 'Eliminar variante',
  'Cancel': 'Cancelar',
  'Save Product': 'Guardar producto',
  'e.g. 500 ml': 'p. ej. 500 ml',
  'e.g. BEV-COKE-500': 'p. ej. BEV-COKE-500',
  'Complete all required fields.': 'Completa todos los campos obligatorios.',
  'Price and stock must be valid non-negative numbers.': 'El precio y el stock deben ser números válidos no negativos.',
  'Each SKU must be unique.': 'Cada SKU debe ser único.',
  'Manage branches and inventory storage locations.': 'Administra sucursales y ubicaciones de inventario.',
  'Branches': 'Sucursales',
  'Storage Locations': 'Ubicaciones de almacenamiento',
  'Branch': 'Sucursal',
  'Address': 'Dirección',
  'Status': 'Estado',
  'Active': 'Activo',
  'Inactive': 'Inactivo',
  'Location': 'Ubicación',
  'Type': 'Tipo',
  'Description': 'Descripción',
  'Exhibition': 'Exhibición',
  'Warehouse': 'Almacén',
  'Central / Independent': 'Central / Independiente',
  'Search locations': 'Buscar ubicaciones',
  'Search branches...': 'Buscar sucursales...',
  'Search storage locations...': 'Buscar ubicaciones de almacenamiento...',
  'Add Branch': 'Agregar sucursal',
  'Add Location': 'Agregar ubicación',
  'No branches found.': 'No se encontraron sucursales.',
  'No storage locations found.': 'No se encontraron ubicaciones.',
  'Demo data. Changes reset when the page is reloaded.': 'Datos de prueba. Los cambios se restablecen al recargar.',
  'Edit Branch': 'Editar sucursal',
  'Branch Name': 'Nombre de sucursal',
  'Save Branch': 'Guardar sucursal',
  'Edit Location': 'Editar ubicación',
  'Location Name': 'Nombre de ubicación',
  'Location Type': 'Tipo de ubicación',
  'Save Location': 'Guardar ubicación',
  'Exhibition and Warehouse will be created automatically.': 'Se crearán automáticamente Exhibición y Almacén.',
  'Name and address are required.': 'El nombre y la dirección son obligatorios.',
  'A branch with this name already exists.': 'Ya existe una sucursal con ese nombre.',
  'Branch saved successfully.': 'Sucursal guardada correctamente.',
  'Location name is required.': 'El nombre de la ubicación es obligatorio.',
  'Exhibition must belong to a branch.': 'La exhibición debe pertenecer a una sucursal.',
  'Select a valid branch.': 'Selecciona una sucursal válida.',
  'This location name already exists in the selected branch.': 'Ya existe una ubicación con ese nombre en la sucursal seleccionada.',
  'Each branch must retain an active exhibition and warehouse.': 'Cada sucursal debe conservar una exhibición y un almacén activos.',
  'Location saved successfully.': 'Ubicación guardada correctamente.',
  'Cannot delete this location. Each branch must retain an active exhibition and warehouse.': 'No se puede eliminar esta ubicación. Cada sucursal debe conservar una exhibición y un almacén activos.',
  'Are you sure you want to delete': '¿Seguro que deseas eliminar',
  'deleted successfully.': 'eliminada correctamente.',
  'Main navigation': 'Navegación principal',
  'Location views': 'Vistas de ubicaciones',
}

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (text: string) => string
}
const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("chops-language") === "es" ? "es" : "en",
  )
  useEffect(() => {
    localStorage.setItem("chops-language", language)
    document.documentElement.lang = language
  }, [language])
  const t = (text: string) => language === "es" ? spanish[text] ?? text : text
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}
