import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

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
  TrendingDown,
  FileBarChart2,
  Menu,
  X,
} from "lucide-react";

import ChopsSelect from "./components/ChopsSelect";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./components/NotFound";
import RouteFallback from "./components/RouteFallback";

import {
  LanguageProvider,
  useLanguage,
} from "./i18n/LanguageContext";

import { OperationsProvider } from "./demo/OperationsContext";

// Each page is its own chunk: the initial bundle only carries the shell.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const LocationsPage = lazy(() => import("./pages/LocationsPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const StockMovementsPage = lazy(
  () => import("./pages/StockMovementsPage")
);
const LossesPage = lazy(() => import("./pages/LossesPage"));
const StockCountPage = lazy(() => import("./pages/StockCountPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

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
  {
    path: "/losses",
    label: "Losses & Shrinkage",
    icon: TrendingDown,
  },
  {
    path: "/reports",
    label: "Reports & Analytics",
    icon: FileBarChart2,
  },
];

function AppContent() {
  const { language, setLanguage, t } = useLanguage();

  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("chops-theme") === "light"
      ? "light"
      : "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("chops-theme", theme);
    // Brief fade for the theme change only (class is removed right after).
    root.classList.add("theme-transition");
    const id = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      300
    );
    return () => window.clearTimeout(id);
  }, [theme]);

  // Mobile drawer (<= 768px). On desktop the sidebar is always visible.
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close after navigating.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    // If the viewport grows past the breakpoint, drop the open state.
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => mq.matches && setMenuOpen(false);

    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    document.body.classList.add("nav-open");
    sidebarRef.current
      ?.querySelector<HTMLElement>(".nav-link")
      ?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
      document.body.classList.remove("nav-open");
    };
  }, [menuOpen]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        {t("Skip to content")}
      </a>

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={menuOpen ? "sidebar is-open" : "sidebar"}
      >
        <div className="brand">
          <h1>Chops</h1>
          <button
            type="button"
            className="sidebar-close"
            aria-label={t("Close menu")}
            onClick={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
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

      <div
        className={menuOpen ? "sidebar-backdrop is-open" : "sidebar-backdrop"}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div className="main-area">
        <header className="app-header">
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-toggle"
            aria-label={t("Open menu")}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

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
                onChange={(value) =>
                  setLanguage(value as "en" | "es")
                }
              />
            </div>

            <button
              type="button"
              className="theme-toggle"
              aria-label={t(
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              )}
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
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

        <main id="main-content" className="page-content" tabIndex={-1}>
          {/* key resets the boundary when the user navigates away */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <div className="page-transition">
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/locations" element={<LocationsPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route
                    path="/inventory/count"
                    element={<StockCountPage />}
                  />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route
                    path="/stock-movements"
                    element={<StockMovementsPage />}
                  />
                  <Route path="/losses" element={<LossesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <OperationsProvider>
        <AppContent />
      </OperationsProvider>
    </LanguageProvider>
  );
}
