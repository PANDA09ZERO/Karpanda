import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Provider, useApp } from "./context";
import { DemoBanner, Loading, PortalLayout, PublicLayout } from "./components";
import {
  Catalog,
  Checkout,
  Detail,
  HowItWorks,
  NotFound,
  Terms,
} from "./pages/Store";
import { Auth, Protected } from "./pages/Auth";
import { ClientHome, Downloads, Profile } from "./pages/Portal";
import { Admin } from "./pages/Admin";
import { ForcedPasswordChange, PasswordForm } from "./pages/Users";
import { ServicesPage } from "./pages/PublicMarketing";
import { PublicAnalytics } from "./components/PublicAnalytics";
const OfficeDashboard = lazy(() =>
  import("./pages/OfficeDashboard").then((m) => ({
    default: m.OfficeDashboard,
  })),
);
const OfficeDetail = lazy(() =>
  import("./pages/OfficeRecords").then((m) => ({ default: m.OfficeDetail })),
);
const OfficeList = lazy(() =>
  import("./pages/OfficeRecords").then((m) => ({ default: m.OfficeList })),
);
const PublicSupport = lazy(() =>
  import("./pages/OfficeRecords").then((m) => ({ default: m.PublicSupport })),
);
const ManageUsers = lazy(() =>
  import("./pages/ManageUsers").then((m) => ({ default: m.ManageUsers })),
);
const UserDetail = lazy(() =>
  import("./pages/ManageUsers").then((m) => ({ default: m.UserDetail })),
);
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
  const { pathname, hash } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Karpanda · ${pathname.startsWith("/admin") ? "Administración" : pathname.startsWith("/cuenta") ? "Mi espacio" : pathname === "/servicios" ? "Desarrollo web y soluciones a medida" : pathname === "/como-funciona" ? "Cómo funciona" : pathname === "/terminos" ? "Términos y privacidad" : "Software para crecer"}`;
    document.getElementById("main")?.focus({ preventScroll: true });
    if (hash) {
      const frame = requestAnimationFrame(() => {
        try {
          document
            .getElementById(decodeURIComponent(hash.slice(1)))
            ?.scrollIntoView();
        } catch {
          /* Ignore malformed fragments. */
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname, hash]);
  return null;
}
function AppRoutes() {
  const { error, refresh, user } = useApp();
  const location = useLocation();
  if (
    user?.app_metadata.must_change_password &&
    location.pathname !== "/cambiar-contrasena"
  ) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <NavigationEffects />
      <PublicAnalytics />
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
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Catalog />} />
            <Route path="servicios" element={<ServicesPage />} />
            <Route path="producto/:slug" element={<Detail />} />
            <Route path="compra/:slug" element={<Checkout />} />
            <Route path="como-funciona" element={<HowItWorks />} />
            <Route path="soporte" element={<PublicSupport />} />
            <Route path="terminos" element={<Terms />} />
            <Route path="acceso" element={<Auth />} />
            <Route
              path="cambiar-contrasena"
              element={
                <Protected>
                  <ForcedPasswordChange />
                </Protected>
              }
            />
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
            <Route
              path="pedidos"
              element={<OfficeList module="orders" admin={false} />}
            />
            <Route
              path="pedidos/:id"
              element={<OfficeDetail module="orders" admin={false} />}
            />
            <Route
              path="licencias"
              element={<OfficeList module="licenses" admin={false} />}
            />
            <Route
              path="licencias/:id"
              element={<OfficeDetail module="licenses" admin={false} />}
            />
            <Route path="descargas" element={<Downloads />} />
            <Route
              path="soporte"
              element={<OfficeList module="tickets" admin={false} />}
            />
            <Route
              path="soporte/:id"
              element={<OfficeDetail module="tickets" admin={false} />}
            />
            <Route path="perfil" element={<Profile />} />
            <Route path="seguridad" element={<PasswordForm />} />
          </Route>
          <Route
            path="admin"
            element={
              <Protected admin>
                <PortalLayout admin />
              </Protected>
            }
          >
            <Route index element={<OfficeDashboard />} />
            <Route path="productos" element={<Admin />} />
            <Route path="pedidos" element={<OfficeList module="orders" />} />
            <Route
              path="pedidos/:id"
              element={<OfficeDetail module="orders" />}
            />
            <Route
              path="licencias"
              element={<OfficeList module="licenses" />}
            />
            <Route
              path="licencias/:id"
              element={<OfficeDetail module="licenses" />}
            />
            <Route path="soporte" element={<OfficeList module="tickets" />} />
            <Route
              path="soporte/:id"
              element={<OfficeDetail module="tickets" />}
            />
            <Route path="usuarios" element={<ManageUsers />} />
            <Route path="usuarios/:id" element={<UserDetail />} />
            <Route path="clientes" element={<ManageUsers />} />
            <Route path="clientes/:id" element={<UserDetail />} />
          </Route>
        </Routes>
      </Suspense>
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
