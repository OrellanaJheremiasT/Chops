# Desarrollo de CHOPS

Estas reglas se aplican a todo el repositorio. Antes de modificar un módulo, lee el README, identifica sus consumidores y comprueba cómo se ejecuta en desarrollo y en Pages. Parte de una rama basada en `dev`. Los commits, pushes y PR requieren autorización del usuario.

## Arquitectura y contratos

- Conserva rutas, campos JSON, códigos HTTP, mensajes de Problem Detail consumidos por la web y claves de almacenamiento del navegador. Si un cambio rompe compatibilidad, documenta su impacto y acuerda la migración antes de implementarlo.
- En React, las páginas coordinan formularios, solicitudes y estados de carga, error y éxito. Extrae reglas independientes a `features/<módulo>` cuando puedan probarse por separado. Usa `components` para controles compartidos, `api` para HTTP y `demo` para estado y reglas simuladas.
- La selección de datos de producción se define en `api/client.ts`. El desarrollo usa el proxy de Vite. En Pages, la ausencia de URL de API activa la demo. Un error de red debe permanecer visible. Cancela las lecturas pendientes al desmontar el componente e impide que resultados obsoletos sustituyan datos recientes.
- En Spring, organiza por módulo. Los controladores validan DTO y expresan HTTP. Los servicios protegen reglas, orden de operaciones y atomicidad. Las decisiones que dependan del historial deben compartir la sección crítica del registro del movimiento hasta finalizar la escritura.
- Valida los SKU normalizados, la precisión monetaria, las cantidades, la actividad de las ubicaciones y sus referencias. Una operación rechazada debe conservar saldos e historial. Una transferencia conserva el total de unidades del SKU.

## Convenciones

- Usa PascalCase en componentes, tipos y clases, camelCase en variables y funciones, y el prefijo `use` en hooks. En Java usa paquetes en minúsculas y UPPER_SNAKE_CASE en constantes. Los nombres deben expresar el concepto comercial o la responsabilidad.
- Mantén TypeScript estricto. Valida entradas externas antes de utilizarlas. Prefiere tipos concretos y `unknown` en límites de confianza. Usa `BigDecimal` para importes de la API y conserva la precisión durante los cálculos.
- Reutiliza reglas de dominio y tokens CSS existentes. Conserva los temas, traducciones ES/EN, navegación por teclado, foco, anuncios de error y diseño responsive. Conserva el orden de la cascada de estilos.
- Aplica EditorConfig. Los comentarios deben explicar invariantes, restricciones y decisiones que el código por sí solo deje ambiguas. Evita abstracciones especulativas y memoización sin un coste identificable.

## Definition of Done

1. Comprueba los requisitos y casos de error. Verifica que el cambio respeta los contratos y los datos existentes.
2. Añade una regresión para las reglas críticas modificadas. Para inventario comprueba ambos saldos y el historial tanto en éxito como en rechazo.
3. Desde `apps/web`, ejecuta `npm ci`, `npm run lint`, `npm test` y `npm run build`. Desde `services/api`, ejecuta `./mvnw clean verify` (en Windows, `.\mvnw.cmd clean verify`). Usa Node 24 y JDK 21.
4. Recorre los flujos afectados con datos de la fuente correspondiente. Si se toca el límite demo/API, comprueba Pages bajo `/Chops/` y un backend real. Si cambia la interfaz, verifica ES/EN, temas y vista móvil.
5. Revisa el diff, nombres, duplicaciones y documentación. Registra pruebas, limitaciones y deuda pendiente. CI debe pasar antes de integrar en `dev`.

La integración funcional de movimientos, persistencia y autenticación se planifica por fase. Verifica primero el comportamiento existente descrito en [la auditoría](docs/refactorizacion.md).
