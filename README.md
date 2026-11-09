<div align="center">

# 🍖 Chops

**[Descripción corta: qué es Chops y qué problema resuelve.]**

[![License: MIT](https://img.shields.io/github/license/OrellanaJheremiasT/Chops?style=for-the-badge&color=blue)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/commits/main)
[![Repo size](https://img.shields.io/github/repo-size/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops)
[![Issues](https://img.shields.io/github/issues/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/issues)
[![Stars](https://img.shields.io/github/stars/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/stargazers)

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=flat-square&logo=apachemaven&logoColor=white)

</div>

---

## 📖 Tabla de contenidos

- [Acerca del proyecto](#-acerca-del-proyecto)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Requisitos](#-requisitos)
- [Puesta en marcha](#-puesta-en-marcha)
- [Pruebas](#-pruebas)
- [Estado del proyecto](#-estado-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## 🎯 Acerca del proyecto

[Explicá en 2–3 líneas qué hace Chops, para quién es y cuál es su objetivo.]

### Funcionalidades

- [ ] [Funcionalidad 1]
- [ ] [Funcionalidad 2]
- [ ] [Funcionalidad 3]

## 🧰 Stack tecnológico

| Capa | Tecnología | Detalle |
| --- | --- | --- |
| Frontend | React + Vite | Servidor de desarrollo en el puerto `5173` |
| Iconos | [lucide-react](https://lucide.dev/) | Dependencia declarada en el `package.json` raíz |
| Backend | Java 21 + Spring Boot | API en el puerto `8080`, empaquetada con Maven Wrapper |
| Gestión de dependencias | npm / Maven Wrapper | No requiere instalar Maven de forma global |

## 🗂 Estructura del repositorio

```text
Chops/
├── apps/
│   └── web/            # Aplicación frontend
├── services/
│   └── api/            # API REST (Spring Boot)
├── .gitignore
├── LICENSE
├── package.json        # Dependencias compartidas (lucide-react)
└── README.md
```

## ✅ Requisitos

- [Git](https://git-scm.com/)
- [Node.js 24](https://nodejs.org/) y npm
- [Java JDK 21](https://adoptium.net/)
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado)

> 💡 No hace falta instalar Maven: el proyecto incluye Maven Wrapper (`mvnw`).

## 🚀 Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/OrellanaJheremiasT/Chops.git
cd Chops
```

### 2. Ejecutar el frontend

```bash
cd apps/web
npm install
npm run dev
```

Abrir 👉 http://localhost:5173/

### 3. Ejecutar el backend

En otra terminal, desde la raíz del proyecto:

```bash
cd services/api
./mvnw spring-boot:run
```

Servidor 👉 http://localhost:8080/

<details>
<summary>🪟 ¿Usás Windows (PowerShell)?</summary>

```powershell
# Frontend
cd apps/web
npm.cmd install
npm.cmd run dev

# Backend
cd services/api
.\mvnw.cmd spring-boot:run
```

</details>

> ⚠️ **Nota:** la ruta raíz del backend devuelve `404` hasta que se implementen los controladores correspondientes.

## 🧪 Pruebas

**Frontend** (verifica que la aplicación compila):

```bash
cd apps/web
npm run build
```

**Backend:**

```bash
cd services/api
./mvnw clean test
```

## 🚧 Estado del proyecto

🟡 En desarrollo activo. El frontend y el backend se ejecutan por separado y todavía no hay endpoints implementados.

### Hoja de ruta

- [x] Estructura base del monorepo (`apps/web` + `services/api`)
- [x] Configuración de desarrollo local
- [ ] Controladores y endpoints de la API
- [ ] Conexión frontend ↔ backend
- [ ] Pruebas automatizadas
- [ ] Despliegue

## 🤝 Contribuir

1. Hacé un fork del proyecto.
2. Creá una rama para tu cambio: `git checkout -b feature/mi-mejora`
3. Hacé commit de tus cambios: `git commit -m "feat: agrega mi mejora"`
4. Subí la rama: `git push origin feature/mi-mejora`
5. Abrí un Pull Request.

## 📄 Licencia

Distribuido bajo la licencia **MIT**. Consultá el archivo [LICENSE](LICENSE) para más información.

## 👤 Autor

**Jheremias T. Orellana** — [@OrellanaJheremiasT](https://github.com/OrellanaJheremiasT)

---

<div align="center">

⭐ Si te sirve el proyecto, dejale una estrella.

</div>
