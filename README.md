<div align="center">

# Chops

**Inventory & Sales Management**

A modern retail management platform for organizing products, monitoring inventory, recording sales, and understanding store performance.

[![MIT License](https://img.shields.io/github/license/OrellanaJheremiasT/Chops?style=for-the-badge)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/commits/main)
[![Issues](https://img.shields.io/github/issues/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/issues)
[![Stars](https://img.shields.io/github/stars/OrellanaJheremiasT/Chops?style=for-the-badge)](https://github.com/OrellanaJheremiasT/Chops/stargazers)

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4-6DB33F?logo=springboot&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-Wrapper-C71A36?logo=apachemaven&logoColor=white)

</div>

---

## About Chops

**Chops** is a web-based inventory and sales management project designed for convenience stores and other small retail businesses. It aims to bring everyday store operations into one interface: product catalogs, stock by location, point-of-sale workflows, inventory movements, shrinkage, and operational reporting.

The project uses a **React + TypeScript** frontend and a **Java + Spring Boot** REST API. Development is incremental: some screens operate with demo data while backend integration and durable persistence are being expanded.

## Features

| Module | Current scope |
| --- | --- |
| **Dashboard** | Store KPIs, low-stock alerts, stock movements, loss metrics, and sample sales charts |
| **Products** | Product catalog, categories, and independent SKUs for variants |
| **Locations** | Branches with exhibition and warehouse storage areas |
| **Inventory** | Stock balances by location, consolidated views, and movement registration |
| **Sales** | Demo point-of-sale screen with cart, payment selection, and receipts |
| **Stock Movements** | Receive, dispatch, and transfer inventory with movement history |
| **Losses & Shrinkage** | Register expired, damaged, quality-related, and other losses; distinguish confirmed theft from unexplained shortages |
| **Physical Stock Count** | Compare counted quantities with recorded stock and document discrepancies |
| **Reports & Analytics** | Period filters, operational summaries, local report closings, and CSV/JSON exports |
| **Interface** | Responsive layout, light/dark themes, and English/Spanish language options |

> **Demo-data notice:** Not every module currently shares the same backend data source. Some figures and transactions are illustrative. Sales are not yet fully synchronized with inventory or dashboard metrics.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Routing & UI | React Router, lucide-react, custom UI components |
| Backend | Java 21, Spring Boot 4, REST API |
| Build tools | npm, Maven Wrapper |
| Automation | GitHub Actions, Dependabot |
| Current data handling | In-memory backend services; browser-local/demo state in parts of the frontend |
| Planned persistence | Database-backed storage and fully integrated transactions |

## Repository structure

```text
Chops/
├── apps/
│   └── web/                 # React + TypeScript application
├── services/
│   └── api/                 # Spring Boot REST API
├── .github/
│   └── workflows/           # Automation and deployment workflows
├── .gitignore
├── LICENSE
└── README.md
```

## Requirements

- [Git](https://git-scm.com/)
- [Node.js 24](https://nodejs.org/) and npm
- [Java JDK 21](https://adoptium.net/)
- Optional: [Visual Studio Code](https://code.visualstudio.com/)

The backend includes **Maven Wrapper**, so a separate Maven installation is not required.

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/OrellanaJheremiasT/Chops.git
cd Chops
```

### 2. Start the backend

From the repository root:

```bash
cd services/api
./mvnw spring-boot:run
```

On **Windows PowerShell**:

```powershell
cd services/api
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080`. Check its health endpoint at:

`http://localhost:8080/api/v1/health`

### 3. Start the frontend

Open a **second terminal** at the repository root:

```bash
cd apps/web
npm install
npm run dev
```

On Windows PowerShell, if the execution policy blocks `npm.ps1`, run `npm.cmd install` and `npm.cmd run dev` instead.

Open `http://localhost:5173` in your browser. During local development, Vite proxies `/api` requests to `http://localhost:8080`.

## REST API

The backend currently provides endpoints in these areas:

| Area | Base path |
| --- | --- |
| API health | `/api/v1/health` |
| Product catalog | `/api/v1/products` |
| Branches | `/api/v1/branches` |
| Storage locations | `/api/v1/locations` |
| Inventory balances | `/api/v1/inventory/balances` |
| Inventory movements | `/api/v1/inventory/movements` |

> Backend services currently keep core data **in memory**. Restarting the API can reset this data. Persistent database storage remains a future milestone.

## Quality checks

**Frontend build:**

```bash
cd apps/web
npm run build
```

**Frontend lint (issues may still need fixing):**

```bash
npm run lint
```

**Backend tests:**

```bash
cd services/api
./mvnw clean test
```

On Windows, replace `./mvnw` with `.\mvnw.cmd`.

## Development status & roadmap

**Status: Under active development.** The interface and initial API modules exist, but the project is not yet a fully integrated production-ready retail system.

- [x] React + TypeScript frontend and Spring Boot project structure
- [x] Responsive navigation, custom controls, dark/light themes, and EN/ES support
- [x] Product, location, and inventory API foundations
- [x] Inventory movements, losses, stock counts, and reporting interfaces
- [x] CSV/JSON export capabilities in reports
- [x] GitHub Actions workflows and Dependabot configuration
- [ ] Connect sales, inventory, stock movements, losses, and dashboard to one consistent data model
- [ ] Replace in-memory/demo data with persistent database storage
- [ ] Complete end-to-end tests and address remaining lint issues
- [ ] Authentication, authorization, and production security hardening
- [ ] Deploy and validate the complete frontend + backend solution

## Contributing

Contributions and suggestions are welcome through [GitHub Issues](https://github.com/OrellanaJheremiasT/Chops/issues) and Pull Requests.

1. Create a new branch from `dev`, such as `feature/your-feature`.
2. Implement and test your changes.
3. Open a Pull Request targeting `dev`.
4. Changes can be promoted to `main` after review.

## License

Released under the [MIT License](LICENSE).

## Author

**Jheremias T. Orellana** — [@OrellanaJheremiasT](https://github.com/OrellanaJheremiasT)

---

<div align="center">

**Chops — Inventory & Sales Management**

If you find this project interesting, consider giving it a star.

</div>
