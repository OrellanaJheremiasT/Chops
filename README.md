<div align="center">

# 🍖 Chops

**[Short description: what Chops is and what problem it solves.]**

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

## 📖 Table of contents

- [About the project](#-about-the-project)
- [Tech stack](#-tech-stack)
- [Repository structure](#-repository-structure)
- [Requirements](#-requirements)
- [Getting started](#-getting-started)
- [Testing](#-testing)
- [Project status](#-project-status)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 About the project

[Explain in 2–3 lines what Chops does, who it's for, and what its goal is.]

### Features

- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

## 🧰 Tech stack

| Layer | Technology | Details |
| --- | --- | --- |
| Frontend | React + Vite | Development server on port `5173` |
| Icons | [lucide-react](https://lucide.dev/) | Dependency declared in the root `package.json` |
| Backend | Java 21 + Spring Boot | API on port `8080`, built with Maven Wrapper |
| Dependency management | npm / Maven Wrapper | No global Maven installation required |

## 🗂 Repository structure

```text
Chops/
├── apps/
│   └── web/            # Frontend application
├── services/
│   └── api/            # REST API (Spring Boot)
├── .gitignore
├── LICENSE
├── package.json        # Shared dependencies (lucide-react)
└── README.md
```

## ✅ Requirements

- [Git](https://git-scm.com/)
- [Node.js 24](https://nodejs.org/) and npm
- [Java JDK 21](https://adoptium.net/)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

> 💡 You don't need to install Maven: the project includes the Maven Wrapper (`mvnw`).

## 🚀 Getting started

### 1. Clone the repository

```bash
git clone https://github.com/OrellanaJheremiasT/Chops.git
cd Chops
```

### 2. Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Open 👉 http://localhost:5173/

### 3. Run the backend

In another terminal, from the project root:

```bash
cd services/api
./mvnw spring-boot:run
```

Server 👉 http://localhost:8080/

<details>
<summary>🪟 Using Windows (PowerShell)?</summary>

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

> ⚠️ **Note:** the backend's root route returns `404` until the corresponding controllers are implemented.

## 🧪 Testing

**Frontend** (checks that the app builds):

```bash
cd apps/web
npm run build
```

**Backend:**

```bash
cd services/api
./mvnw clean test
```

## 🚧 Project status

🟡 Under active development. The frontend and backend run separately, and no endpoints are implemented yet.

### Roadmap

- [x] Base monorepo structure (`apps/web` + `services/api`)
- [x] Local development setup
- [ ] API controllers and endpoints
- [ ] Frontend ↔ backend connection
- [ ] Automated tests
- [ ] Deployment

## 🤝 Contributing

1. Fork the project.
2. Create a branch for your change: `git checkout -b feature/my-improvement`
3. Commit your changes: `git commit -m "feat: add my improvement"`
4. Push the branch: `git push origin feature/my-improvement`
5. Open a Pull Request.

## 📄 License

Distributed under the **MIT** license. See the [LICENSE](LICENSE) file for more information.

## 👤 Author

**Jheremias T. Orellana** — [@OrellanaJheremiasT](https://github.com/OrellanaJheremiasT)

---

<div align="center">

⭐ If you find this project useful, give it a star.

</div>
