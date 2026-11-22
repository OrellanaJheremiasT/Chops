# Auditoría y refactorización de CHOPS

22 de noviembre de 2026. Base local de seguimiento `origin/dev`, commit `44a43da`. Rama de trabajo `codex/refactorizacion-integral`. Esta base contenía README, configuración de CI y pruebas Java. Se creó la guía permanente del repositorio en [AGENTS.md](../AGENTS.md).

## Fuentes de datos y alcance

| Módulo | Comportamiento observado |
| --- | --- |
| Productos y ubicaciones | CRUD REST en desarrollo y producción con API configurada. Pages sin URL usa catálogos demo en memoria de la pestaña. |
| Inventario | La vista real combina variantes, sucursales, ubicaciones y saldos de la API. La vista demo usa las existencias del contexto de operaciones. |
| Stock Movements | Ya existían pantalla real, formulario de registro, consulta de historial y alternativa demo en la base. Se preservó el flujo de P1-10.8.4 encontrado en el código. |
| Dashboard, mermas, conteo y reportes | Usan datos ilustrativos y operaciones demo del navegador. El conteo y las mermas ajustan el saldo demo. Los reportes exportan CSV/JSON y guardan cierres locales. |
| Ventas | Caja demostrativa con carrito, cobro y comprobante. Sus ventas no alimentan el libro de inventario de Spring. |
| Infraestructura | Vite conserva el proxy local y la base de Pages. Spring organiza catálogo, ubicaciones e inventario por módulo, guarda sus datos en memoria y devuelve errores HTTP como Problem Detail. |

El plan suministrado situaba la integración de movimientos en una fase futura. Conviene conciliar los criterios pendientes de esa fase con la implementación existente antes de estimar más trabajo. El aviso histórico de errores de ESLint también estaba obsoleto.

## Hallazgos y cambios

| Prioridad | Hallazgo | Resolución |
| --- | --- | --- |
| Alta | Spring aceptaba 1.7 unidades por HTTP, respondía 201 y registraba 1. | Deserialización exacta de la cantidad del movimiento, autorizada durante la auditoría. Las fracciones y los desbordamientos se rechazan antes de tocar los saldos. Un valor como 2.0 sigue siendo válido. |
| Alta | Entre la comprobación de referencias y la escritura del catálogo o la ubicación podía entrar un movimiento. | El servicio de inventario conserva el bloqueo usado por el registro hasta completar la mutación. También coordina el cambio de actividad de sucursal. Se mantiene el orden de bloqueo inventario → catálogo/ubicaciones. |
| Alta | Una entrada o transferencia demo podía superar el entero seguro de JavaScript y guardar un saldo que el lector del navegador rechazaría después. | La regla extraída en `applyMovement` comprueba el destino antes de modificar los saldos. Solo copia el registro del SKU afectado. |
| Media | La decisión de modo se repetía y el indicador de salud interpretaba espacios en la URL de manera distinta. | El cliente define una decisión común. Los catálogos mutables de demostración se cargan desde `demo` bajo demanda. Se conservaron las firmas públicas y la cancelación HTTP. |
| Media | El alta de un movimiento desplazaba todo el historial para insertar en la primera posición. | Una cola de dos extremos conserva el orden más reciente primero con inserción de coste amortizado constante. |
| Media | Los avisos de npm alcanzaban nueve paquetes de desarrollo por la cadena de minimatch. | Actualización compatible del lockfile. Instalación limpia comprobada y cero avisos reportados al finalizar. |
| Media | El despliegue permitía continuar si fallaba ESLint y el flujo general omitía PR a dev. | Lint bloqueante también en Pages, cero advertencias permitidas, pruebas web en CI y cobertura de dev y main. |
| Mantenimiento | Páginas de inventario y reportes incluían agregación, serialización y descarga junto al JSX. Había dos componentes sin consumidores. | Se extrajeron las reglas a módulos de funcionalidad con pruebas. Se retiraron las versiones sin uso del gráfico y del diálogo con sus CSS. El dashboard usa StackedBars y la aplicación usa DialogProvider. |

Productos distingue conflictos de historial de un SKU duplicado y usa un conjunto para comprobar SKU ocupados. La demo calcula el siguiente identificador recorriendo el historial sin expandirlo en argumentos. Se preservaron los DTO de salida, los nombres JSON, la normalización de SKU, las claves de almacenamiento, la cascada activa de CSS y las rutas. Las herramientas nuevas de prueba usan Node y Vite ya instalados.

## Verificación

| Comprobación | Base | Resultado final |
| --- | --- | --- |
| TypeScript y compilación Vite | Correctos | Correctos con tipado estricto explícito. Se compilaron versiones de producción demo y API. |
| ESLint | Correcto | Correcto con límite de cero advertencias y análisis de las pruebas JavaScript. |
| Pruebas del frontend | Sin script de pruebas | 4 aprobadas. Cubren CRUD demo, copias independientes, ubicaciones obligatorias, agregación y filtros, CSV, transferencias y desbordamiento. |
| Maven con JDK 21 | 32 aprobadas | 36 aprobadas, cero errores, fallos u omisiones. El wrapper completó clean verify y produjo un JAR ejecutable. |
| Instalación npm y avisos conocidos | 9 moderados en desarrollo | npm ci y auditoría correctos en una copia temporal limpia. |
| GitHub Actions | Lint permisivo en Pages, CI general limitado a main | Se analizaron los cuatro YAML y se ejecutaron localmente las comprobaciones de la aplicación. La ejecución remota y el despliegue quedan pendientes de publicación autorizada. |

La primera ejecución de Maven necesitó acceso al bloqueo de la caché local. En Windows, un binario de Rolldown en uso impidió reemplazar todo `node_modules` en el directorio de trabajo. Se restauraron las dependencias allí y se repitió `npm ci` con éxito en un directorio temporal. Mockito también informó de la carga dinámica de su agente en JDK 21.

**Verificación en navegador.** Edge abrió dashboard, productos, ubicaciones, inventario, conteo, caja, movimientos, mermas y reportes bajo `/Chops/`; las nueve rutas demo cargaron sin solicitudes a `/api/v1`. Con una instancia aislada del JAR se crearon un producto, una sucursal y una recepción. Las cuatro pantallas conectadas mostraron los datos de prueba. El conteo se comprobó además a 390 px, en español y tema claro, sin desbordamiento horizontal del documento. Se comprobó el rechazo HTTP de fracciones con el JAR final. El recorrido verificó carga y datos, y no constituye una comparación visual píxel a píxel ni una prueba de cada interacción de caja.

## Riesgos pendientes

- El backend pierde datos al reiniciarse. El bloqueo cubre una instancia de la aplicación. Una futura persistencia o segunda instancia requerirá restricciones y transacciones en el almacén compartido.
- Los saldos de la API usan long. El navegador representa cantidades con number, con precisión entera hasta 9 007 199 254 740 991. Antes de admitir volúmenes mayores debe acordarse un límite interoperable o una representación exacta para los clientes.
- Las transacciones ilustrativas y los cierres locales no se sincronizan entre pestañas ni con la API. La lectura de cierres valida el contenedor de manera superficial. Una migración debería preservar entradas antiguas o dañadas antes de reemplazarlas.
- El contrato de error cambia para clientes que enviaban unidades fraccionarias y dependían del truncamiento. Deben enviar unidades completas. El historial en memoria crece sin límite y el listado de saldos puede crecer con el producto de SKU y ubicaciones.
- La auditoría de avisos cuantificada corresponde a npm. Maven conserva Dependabot y la comprobación de compilación y pruebas. No se realizó un escaneo independiente de avisos de toda la cadena Maven.
- Antes de continuar la fase funcional, revisar con el equipo qué falta en P1-10.8.4 y ejecutar la CI remota cuando se autorice publicar. La persistencia, autenticación y sincronización de ventas siguen siendo decisiones de fases futuras.

## Inventario de archivos

### Creados

- `.editorconfig`
- `AGENTS.md`
- `apps/web/src/demo/applyMovement.ts`
- `apps/web/src/demo/locations.ts`
- `apps/web/src/demo/products.ts`
- `apps/web/src/features/inventory/stockRows.ts`
- `apps/web/src/features/reports/exportFiles.ts`
- `apps/web/tests/demo-catalogs.test.mjs`
- `apps/web/tests/inventory-and-reports.test.mjs`
- `services/api/src/main/java/com/stockflow/inventory/dto/MovementQuantityDeserializer.java`
- `services/api/src/test/java/com/stockflow/inventory/controller/InventoryQuantityHttpTest.java`
- `docs/refactorizacion.md`

### Modificados

- `.github/workflows/chops-ci.yml`
- `.github/workflows/deploy.yml`
- `README.md`
- `apps/web/eslint.config.js`
- `apps/web/package-lock.json`
- `apps/web/package.json`
- `apps/web/src/api/client.ts`
- `apps/web/src/api/inventory.ts`
- `apps/web/src/api/locations.ts`
- `apps/web/src/api/products.ts`
- `apps/web/src/components/ApiConnectionStatus.tsx`
- `apps/web/src/demo/OperationsContext.tsx`
- `apps/web/src/i18n/LanguageContext.tsx`
- `apps/web/src/pages/InventoryPage.tsx`
- `apps/web/src/pages/ProductsPage.tsx`
- `apps/web/src/pages/ReportsPage.tsx`
- `apps/web/tsconfig.app.json`
- `apps/web/tsconfig.node.json`
- `services/api/src/main/java/com/stockflow/catalog/controller/ProductController.java`
- `services/api/src/main/java/com/stockflow/inventory/dto/InventoryMovementRequest.java`
- `services/api/src/main/java/com/stockflow/inventory/service/InventoryService.java`
- `services/api/src/main/java/com/stockflow/locations/controller/LocationsController.java`
- `services/api/src/test/java/com/stockflow/inventory/service/InventoryServiceTest.java`

### Eliminados

- `apps/web/src/components/ConfirmDialog.css`
- `apps/web/src/components/ConfirmDialog.tsx`
- `apps/web/src/components/OperationsBars.css`
- `apps/web/src/components/OperationsBars.tsx`

Las extracciones trasladaron responsabilidades entre módulos. Ningún archivo completo cambió de ruta.
