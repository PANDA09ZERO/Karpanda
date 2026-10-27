import { useCallback, useEffect, useState } from "react";
import { office, people } from "./office";
export function useRemote<T>(
  service: "office" | "people",
  body: Record<string, any>,
) {
  const key = JSON.stringify(body);
  const [revision, setRevision] = useState(0),
    [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void (
      service === "office"
        ? office<T>(JSON.parse(key))
        : people<T>(JSON.parse(key))
    )
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive)
          setError(
            e instanceof Error ? e.message : "No se pudo cargar esta vista.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [key, revision, service]);
  return { data, loading, error, reload };
}
