import { Link } from "react-router-dom";
import { ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { useRemote } from "../lib/useRemote";
import type { TrafficReport } from "../pages/TrafficDashboard";
export function TrafficTeaser() {
  const { data, loading, error } = useRemote<TrafficReport>("office", {
    module: "traffic",
    days: 7,
  });
  return (
    <Link className="traffic-teaser" to="/admin/visitas">
      <span className="traffic-teaser-icon">
        <ChartNoAxesCombined size={24} />
      </span>
      <div>
        <strong>Lo que pasa en tu página pública</strong>
        <p>
          {loading
            ? "Cargando las visitas…"
            : error
              ? "Abre el informe para revisar la medición."
              : `${Number(data?.metrics.views || 0).toLocaleString("es-PE")} páginas vistas en 7 días · ${Number(data?.metrics.starts || 0)} demos iniciadas`}
        </p>
      </div>
      <span>
        Ver visitas <ArrowUpRight size={17} />
      </span>
    </Link>
  );
}
