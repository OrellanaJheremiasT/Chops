# Chops — P1-10.2: estructura del backend y Health API

## Alcance

Este paquete **solo agrega archivos nuevos** en `services/api`. No modifica el frontend, `pom.xml`,
`ApiApplication.java`, configuración local ni GitHub Pages. Está construido para la estructura
`com.stockflow` y Spring Boot 4.1.1 / Java 21 del archivo `stockflow.zip`.

## Instalar (Windows / PowerShell)

1. Coloca `Chops_P1-10-2_Health_API.zip` en `C:\Users\orell\OneDrive\Desktop\CHOPS`.
2. Abre PowerShell en esa carpeta y ejecuta:

   ```powershell
   Expand-Archive -Path ".\Chops_P1-10-2_Health_API.zip" -DestinationPath "." -Force
   cd services/api
   .\mvnw.cmd test
   .\mvnw.cmd spring-boot:run
   ```

3. Sin cerrar el servidor, abre otra terminal para probar:

   ```powershell
   curl.exe -i http://localhost:8080/api/v1/health
   ```

   Respuesta esperada con HTTP 200:

   ```json
   {"status":"UP","application":"Chops API","version":"1.0.0"}
   ```

4. Si todo pasó correctamente, haz commit desde la raíz del proyecto:

   ```powershell
   cd ../..
   git status
   git add services/api/src/main/java/com/stockflow/controller/HealthController.java services/api/src/main/java/com/stockflow/service/HealthService.java services/api/src/main/java/com/stockflow/dto/HealthResponse.java services/api/src/test/java/com/stockflow/controller/HealthControllerTest.java
   git commit -m "feat(api): add health endpoint with integration test"
   git push origin main
   ```

## Arquitectura

- `controller`: entrada HTTP de la API REST.
- `service`: lógica de aplicación.
- `dto`: contrato JSON de entrada/salida.
- `model`: se agregará al implementar entidades de negocio.
- `repository`: se agregará al configurar persistencia.

La prueba usa `@SpringBootTest`, `@AutoConfigureMockMvc` y `MockMvc`.
El `pom.xml` existente ya declara `spring-boot-starter-webmvc-test`.

## Estado

Este paso **no** conecta todavía React, ni guarda datos en una base de datos.
No se ha ejecutado Maven en el entorno donde se generó este paquete; verifica `mvnw.cmd test` en Windows.
