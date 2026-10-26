import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

export type Language = "en" | "es"

const spanish: Record<string, string> = {

  
  // P1-8: Sales / Checkout
  'Create a sale using exhibition stock.':
    'Registra una venta utilizando el stock de exhibición.',

  'Product Catalog':
    'Catálogo de productos',

  'Search by product, SKU or barcode...':
    'Buscar por producto, SKU o código de barras...',

  'Exhibition Stock':
    'Stock de exhibición',

  'Add to Cart':
    'Agregar al carrito',

  'Add':
    'Agregar',

  'Current Sale':
    'Venta actual',

  'Units':
    'Unidades',

  'Clear Cart':
    'Vaciar carrito',

  'Your cart is empty.':
    'Tu carrito está vacío.',

  'Select products to start a sale.':
    'Selecciona productos para iniciar una venta.',

  'Remove':
    'Quitar',

  'Decrease quantity':
    'Disminuir cantidad',

  'Increase quantity':
    'Aumentar cantidad',

  'Total':
    'Total',

  'Payment Method':
    'Método de pago',

  'Cash':
    'Efectivo',

  'Card':
    'Tarjeta',

  'Amount Received (S/)':
    'Monto recibido (S/)',

  'Amount Received':
    'Monto recibido',

  'Change':
    'Vuelto',

  'Complete Sale':
    'Completar venta',

  'Sale Receipt':
    'Comprobante de venta',

  'Completed':
    'Completada',

  'Recent Sales':
    'Ventas recientes',

  'Sale':
    'Venta',

  'Not enough exhibition stock.':
    'No hay suficiente stock en exhibición.',

  'Add at least one product to the cart.':
    'Agrega al menos un producto al carrito.',

  'Received amount must cover the total.':
    'El monto recibido debe cubrir el total.',

  'Card payments are simulated. No charge will be made.':
    'Los pagos con tarjeta son simulados. No se realizará ningún cobro.',

  'Demo checkout. Sales and stock changes reset on page reload.':
    'Caja de prueba. Las ventas y los cambios de stock se restablecen al recargar.',

  'Inventory overview by branch and storage location.':
    'Resumen del inventario por sucursal y ubicación.',

  'Inventory views':
    'Vistas de inventario',

  'Total Stock':
    'Stock total',

  'Total Units':
    'Unidades totales',

  'Low Stock SKUs':
    'SKU con stock bajo',

  'Out of Stock SKUs':
    'SKU agotados',

  'Out of Stock':
    'Agotado',

  'Barcode':
    'Código de barras',

  'All branches':
    'Todas las sucursales',

  'All locations':
    'Todas las ubicaciones',

    
  // P1-9: Stock Movements

  "Register stock entries, exits and transfers between locations.":
    "Registra entradas, salidas y transferencias entre ubicaciones.",

  "Registered Movements":
    "Movimientos registrados",

  "This session":
    "Esta sesión",

  "New Movement":
    "Nuevo movimiento",

  "Movement Type":
    "Tipo de movimiento",

  "Stock In":
    "Entrada de stock",

  "Stock Out":
    "Salida de stock",

  "Transfer":
    "Transferencia",

  "Product / SKU":
    "Producto / SKU",

  "Available Stock":
    "Stock disponible",

  "Source Location":
    "Ubicación de origen",

  "Destination Location":
    "Ubicación de destino",

  "Quantity":
    "Cantidad",

  "Enter quantity":
    "Ingresa la cantidad",

  "Reason / Notes":
    "Motivo / Notas",

  "Optional movement description...":
    "Descripción opcional del movimiento...",

  "Register Movement":
    "Registrar movimiento",

  "Movement History":
    "Historial de movimientos",

  "Review recorded inventory operations.":
    "Consulta las operaciones de inventario registradas.",

  "Reset Demo":
    "Restablecer demo",

  "Search movements":
    "Buscar movimientos",

  "Search movements...":
    "Buscar movimientos...",

  "Filter by type":
    "Filtrar por tipo",

  "All Types":
    "Todos los tipos",

  "No movements found.":
    "No se encontraron movimientos.",

  "Register your first movement to see it here.":
    "Registra tu primer movimiento para verlo aquí.",

  "Try changing your search or filters.":
    "Prueba cambiando la búsqueda o los filtros.",

  "External":
    "Externo",

  "Enter a valid quantity greater than zero.":
    "Ingresa una cantidad válida mayor que cero.",

  "Select a valid product.":
    "Selecciona un producto válido.",

  "Source and destination must be different.":
    "El origen y el destino deben ser diferentes.",

  "Insufficient stock at the source location.":
    "No hay suficiente stock en la ubicación de origen.",

  "Movement registered successfully.":
    "Movimiento registrado correctamente.",

  "Demo mode: movements and balances reset when the page reloads.":
    "Modo demo: los movimientos y existencias se restablecen al recargar la página.",



  'Search inventory':
    'Buscar inventario',

  'Search by product, SKU or barcode... ':
    'Buscar por producto, SKU o código de barras... ',

  'Filter by stock status':
    'Filtrar por estado del stock',

  'All Stock':
    'Todo el stock',

  'Low Stock Only':
    'Solo stock bajo',

  'Out of Stock Only':
    'Solo agotados',

  'No inventory matches your filters.':
    'No hay productos que coincidan con los filtros.',

  'Demo inventory. Data is not yet synchronized with Products or Locations.':
    'Inventario de prueba. Los datos todavía no están sincronizados con Productos ni Ubicaciones.',

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