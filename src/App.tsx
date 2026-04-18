import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./apps/ProtectedRoutes";
import ErrorBoundary from "./components/ErrorBoundary";
import { initPerformanceMonitoring } from "./utils/analytics";
import { initServiceWorker } from "./utils/pwa";

// Lazy load all pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ForgotPage = lazy(() => import("./pages/ForgotPage"));
const MasterPage = lazy(() => import("./pages/MasterPage"));
const AddProductPage = lazy(() => import("./pages/AddProductPage"));
const ProductMediasPage = lazy(() => import("./admin/products/[id]/pages"));


import { ConfigProvider, theme } from "antd";
import { useThemeStore } from "./hooks/useThemeStore";
import CsvImportWatcher from "./components/product/CsvImportWatcher";

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    // Sync theme with document root for CSS targeting
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Initialize service worker
    initServiceWorker();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#b31f5f", // Keep the branding pink
          borderRadius: 8,
        },
      }}
    >
      <ErrorBoundary>
        <CsvImportWatcher />
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Redirect root ke dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route
                path="/products/:id/:brand/:name/medias"
                element={
                  <ProtectedRoute>
                    <ProductMediasPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/products-media"
                element={
                  <ProtectedRoute>
                    <ProductMediasPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/product-duplicate"
                element={
                  <ProtectedRoute>
                    <AddProductPage />
                  </ProtectedRoute>
                }
              />

              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot" element={<ForgotPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />



              {/* Semua route modul CMS */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MasterPage />
                  </ProtectedRoute>
                }
              />

              {/* ✅ Tambahkan route untuk form product */}
              <Route
                path="/product-form"
                element={
                  <ProtectedRoute>
                    <AddProductPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback terakhir */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;