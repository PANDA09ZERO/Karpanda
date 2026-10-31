import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartNoAxesCombined } from "lucide-react";
import {
  analyticsConfigured,
  consentEvent,
  publicPath,
  readConsent,
  setConsent,
  settingsEvent,
  trackPage,
} from "../lib/analytics";
export function PublicAnalytics() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState(readConsent),
    [editing, setEditing] = useState(false);
  useEffect(() => {
    const changed = () => setChoice(readConsent());
    const settings = () => setEditing(true);
    window.addEventListener(consentEvent, changed);
    window.addEventListener(settingsEvent, settings);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener(consentEvent, changed);
      window.removeEventListener(settingsEvent, settings);
      window.removeEventListener("storage", changed);
    };
  }, []);
  useEffect(() => {
    trackPage(pathname, document.title);
  }, [pathname, choice]);
  if (!analyticsConfigured || !publicPath(pathname) || (choice && !editing))
    return null;
  function choose(value: "accepted" | "rejected") {
    setConsent(value);
    setEditing(false);
  }
  return (
    <aside className="analytics-choice" aria-label="Preferencias de medición">
      <div className="analytics-choice-copy">
        <ChartNoAxesCombined size={22} />
        <div>
          <strong>Nos ayudas a mejorar Karpanda</strong>
          <p>
            Con tu permiso, usamos Google Analytics para conocer las visitas y
            las páginas que más interesan. Puedes navegar sin aceptar y cambiar
            tu elección en el pie de página.{" "}
            <Link to="/terminos#medicion">Más información</Link>
          </p>
        </div>
      </div>
      <div className="analytics-choice-actions">
        <button className="button secondary" onClick={() => choose("rejected")}>
          Solo necesarias
        </button>
        <button className="button" onClick={() => choose("accepted")}>
          Aceptar medición
        </button>
      </div>
    </aside>
  );
}
