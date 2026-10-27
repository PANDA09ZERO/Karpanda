import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Provider, useApp } from "./context";
import { DemoBanner, PortalLayout, PublicLayout } from "./components";
import {
  Catalog,
  Checkout,
  Detail,
  HowItWorks,
  NotFound,
  Terms,
} from "./pages/Store";
import { Auth, Protected } from "./pages/Auth";
import {
  ClientHome,
  Downloads,
  Orders,
  Profile,
  Support,
} from "./pages/Portal";
import { Admin, AdminLicenses } from "./pages/Admin";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="container info-page">
        <h1>No pudimos abrir esta vista.</h1>
        <p>Vuelve a cargar la aplicación para intentarlo de nuevo.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Volver a cargar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function NavigationEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Karpanda · ${pathname.startsWith("/admin") ? "Administración" : pathname.startsWith("/cuenta") ? "Mi espacio" : "Software para crecer"}`;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
function AppRoutes() {
  const { error, refresh } = useApp();
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <NavigationEffects />
      <DemoBanner />
      {error && (
        <div className="global-error" role="alert">
          No pudimos conectar con el catálogo: {error}{" "}
          <button
            className="text-link button-plain"
            onClick={() => void refresh()}
          >
            Reintentar
          </button>
        </div>
      )}
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Catalog />} />
          <Route path="producto/:slug" element={<Detail />} />
          <Route path="compra/:slug" element={<Checkout />} />
          <Route path="como-funciona" element={<HowItWorks />} />
          <Route path="soporte" element={<Support />} />
          <Route path="terminos" element={<Terms />} />
          <Route path="acceso" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="cuenta"
          element={
            <Protected>
              <PortalLayout />
            </Protected>
          }
        >
          <Route index element={<ClientHome />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="descargas" element={<Downloads />} />
          <Route path="soporte" element={<Support />} />
          <Route path="perfil" element={<Profile />} />
        </Route>
        <Route
          path="admin"
          element={
            <Protected admin>
              <PortalLayout admin />
            </Protected>
          }
        >
          <Route index element={<Admin />} />
          <Route path="productos" element={<Admin />} />
          <Route path="pedidos" element={<Orders admin />} />
          <Route path="licencias" element={<AdminLicenses />} />
          <Route path="soporte" element={<Support admin />} />
        </Route>
      </Routes>
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <Provider>
        <AppRoutes />
      </Provider>
    </ErrorBoundary>
  );
}
