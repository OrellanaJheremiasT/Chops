
import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import StockMovementsPage from "./pages/StockMovementsPage";

import {
  LayoutDashboard,
  Package,
  MapPin,
  Boxes,
  ShoppingCart,
  ArrowLeftRight,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

import ChopsSelect from "./components/ChopsSelect";
import {
  LanguageProvider,
  useLanguage,
} from "./i18n/LanguageContext";

import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import LocationsPage from "./pages/LocationsPage";
import InventoryPage from "./pages/InventoryPage";
import CheckoutPage from "./pages/CheckoutPage";

import "./App.css";
import "./language-switcher.css";

const sections = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/products",
    label: "Products",
    icon: Package,
  },
  {
    path: "/locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    path: "/checkout",
    label: "Sales",
    icon: ShoppingCart,
  },
  {
    path: "/stock-movements",
    label: "Stock Movements",
    icon: ArrowLeftRight,
  },
];

function SectionPage({ title }: { title: string }) {
  const { t } = useLanguage();

  return (
    <section className="card section-placeholder">
      <h2>{title}</h2>
      <p>{t("This section is under development.")}</p>
    </section>
  );
}

function AppContent() {
  const { language, setLanguage, t } = useLanguage();

  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("chops-theme") === "light"
      ? "light"
      : "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chops-theme", theme);
  }, [theme]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>Chops</h1>
        </div>

        <nav aria-label={t("Main navigation")}>
          {sections.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="app-header">
          <span className="header-brand">Chops</span>

          <div className="header-controls">
            <div className="language-picker">
              <Globe size={16} aria-hidden="true" />

              <span className="sr-only">
                Language / Idioma
              </span>

              <ChopsSelect
                ariaLabel="Language / Idioma"
                value={language}
                compact
                options={[
                  { value: "en", label: "EN" },
                  { value: "es", label: "ES" },
                ]}
                onChange={(next) =>
                  setLanguage(next as "en" | "es")
                }
              />
            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
              aria-label={t(
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              )}
            >
              {theme === "light" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}

              <span>
                {t(
                  theme === "light"
                    ? "Dark mode"
                    : "Light mode"
                )}
              </span>
            </button>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/products"
              element={<ProductsPage />}
            />

            <Route
              path="/locations"
              element={<LocationsPage />}
            />

            <Route
              path="/inventory"
              element={<InventoryPage />}
            />

            <Route
              path="/checkout"
              element={<CheckoutPage />}
            />

            <Route
              path="/stock-movements"
              element={<StockMovementsPage />}
            />

            {sections
              .filter(
                (section) =>
                  ![
                    "/dashboard",
                    "/products",
                    "/locations",
                    "/inventory",
                    "/checkout",
                    "/stock-movements",
                  ].includes(section.path)
              )
              .map((section) => (
                <Route
                  key={section.path}
                  path={section.path}
                  element={
                    <SectionPage title={t(section.label)} />
                  }
                />
              ))}

            <Route
              path="*"
              element={
                <SectionPage title={t("Page not found")} />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
