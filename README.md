
## Requisitos de desarrollo

- Git
- Node.js 24 y npm
- Java JDK 21
- Maven 3.10
- Visual Studio Code

## Ejecutar el frontend

Desde la carpeta principal del proyecto:

```powershell
cd apps/web
npm.cmd install
npm.cmd run dev
```

Abrir http://localhost:5173/

## Ejecutar el backend

Desde la carpeta principal del proyecto,
en otra terminal:

```powershell
cd services/api
.\mvnw.cmd spring-boot:run
```

Servidor: http://localhost:8080/

Nota: La ruta raíz devuelve 404 hasta que
implementemos los controladores correspondientes.

## Ejecutar pruebas

Frontend:

```powershell
cd apps/web
npm.cmd run build
```

Backend:

```powershell
cd services/api
.\mvnw.cmd clean test
```
