import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Pencil, Plus } from "lucide-react";
import { useApp } from "../context";
import {
  Badge,
  Empty,
  Loading,
  Modal,
  PageHeading,
  Status,
} from "../components";
import { demoMode, supabase } from "../lib/supabase";
import {
  loadProducts,
  money,
  readDemo,
  saveDemo,
  seedProducts,
} from "../lib/data";
import type { License, Order, Product } from "../types";
import { useOrders } from "./Portal";
export function Admin() {
  const location = useLocation();
  const onlyProducts = location.pathname.endsWith("/productos");
  const { refresh, notify } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const { orders } = useOrders(true);
  const [licenseCount, setLicenseCount] = useState(0);
  const reload = useCallback(async () => {
    try {
      setProducts(await loadProducts(true));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los productos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    if (supabase)
      void supabase
        .from("kp_licenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .then(({ count }) => setLicenseCount(count || 0));
  }, [reload]);
  const close = useCallback(() => setEditing(undefined), []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const product = {
      name: String(form.get("name")).trim(),
      slug: String(form.get("slug")).trim(),
      category: String(form.get("category")).trim(),
      description: String(form.get("description")).trim(),
      price: Number(form.get("price")),
      app_url: String(form.get("app_url")).trim() || null,
      published: editing?.published ?? false,
    };
    try {
      if (demoMode) {
        const list = editing
          ? products.map((p) =>
              p.id === editing.id ? { ...p, ...product } : p,
            )
          : [...products, { ...product, id: crypto.randomUUID() }];
        saveDemo("products", list);
      } else {
        const result = editing
          ? await supabase!
              .from("kp_products")
              .update(product)
              .eq("id", editing.id)
          : await supabase!.from("kp_products").insert(product);
        if (result.error) throw result.error;
      }
      await reload();
      await refresh();
      close();
      notify("Producto guardado correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(p: Product) {
    setBusy(true);
    try {
      if (demoMode)
        saveDemo(
          "products",
          products.map((v) =>
            v.id === p.id ? { ...v, published: !v.published } : v,
          ),
        );
      else {
        const { error } = await supabase!
          .from("kp_products")
          .update({ published: !p.published })
          .eq("id", p.id);
        if (error) throw error;
      }
      await reload();
      await refresh();
      notify(
        p.published ? "Producto retirado del catálogo." : "Producto publicado.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar el producto.",
      );
    } finally {
      setBusy(false);
    }
  }
  const demoLicenseCount = new Set(
    orders.filter((o) => o.status === "demo").map((o) => o.product_id),
  ).size;
  return (
    <>
      <div className="row heading-row">
        <PageHeading
          title={
            onlyProducts
              ? "Tus productos, listos para crecer."
              : "Tu negocio, de un vistazo."
          }
        >
          Productos, pedidos y licencias en un mismo espacio.
        </PageHeading>
        {demoMode && <Badge>Datos de demostración</Badge>}
      </div>
      {!onlyProducts && (
        <div className="metric-grid">
          {[
            [
              "Productos",
              products.filter((p) => p.published).length,
              "Catálogo publicado",
            ],
            ["Pedidos", orders.length, "Pedidos registrados"],
            [
              "Licencias activas",
              demoMode ? demoLicenseCount : licenseCount,
              demoMode ? "Accesos simulados" : "Accesos habilitados",
            ],
          ].map(([label, value, note]) => (
            <article className="soft-panel metric" key={label}>
              <span className="muted">{label}</span>
              <strong>{value}</strong>
              <small className="green">{note}</small>
            </article>
          ))}
        </div>
      )}
      <div className="row section-title">
        <h2>Productos publicados</h2>
        <button className="button" onClick={() => setEditing(null)}>
          <Plus size={18} /> Nuevo producto
        </button>
      </div>
      {error && editing === undefined && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : (
        <div className="table-wrap desktop-records">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Plan mensual</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small className="muted">{p.category}</small>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>
                    <button
                      className="button-plain"
                      disabled={busy}
                      onClick={() => void toggle(p)}
                      aria-label={`${p.published ? "Retirar" : "Publicar"} ${p.name}`}
                    >
                      <Badge className={p.published ? "" : "warning"}>
                        {p.published ? "Publicado" : "Borrador"}
                      </Badge>
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-link button-plain"
                      onClick={() => {
                        setEditing(p);
                        setError("");
                      }}
                    >
                      Editar <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && <Empty title="Añade tu primer producto" />}
        </div>
      )}
      {!loading && (
        <div className="mobile-records">
          {products.map((p) => (
            <article className="record-card" key={p.id}>
              <div className="record-card-title">{p.name}</div>
              <dl>
                <div>
                  <dt>Categoría</dt>
                  <dd>{p.category}</dd>
                </div>
                <div>
                  <dt>Plan mensual</dt>
                  <dd>{money(p.price)}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>
                    <Badge className={p.published ? "" : "warning"}>
                      {p.published ? "Publicado" : "Borrador"}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <div className="record-actions">
                <button
                  className="button secondary"
                  onClick={() => {
                    setEditing(p);
                    setError("");
                  }}
                >
                  Editar <Pencil size={15} />
                </button>
                <button
                  className="text-link button-plain"
                  disabled={busy}
                  onClick={() => void toggle(p)}
                >
                  {p.published ? "Retirar" : "Publicar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!onlyProducts && (
        <section className="activity">
          <div className="row">
            <h2>Actividad reciente</h2>
            <Link className="text-link" to="/admin/pedidos">
              Ver pedidos <ArrowRight size={16} />
            </Link>
          </div>
          {orders.slice(0, 3).map((o) => (
            <div className="activity-row" key={o.id}>
              <span className="muted">
                {o.product_name} · {o.id.slice(0, 8)}
              </span>
              <Status status={o.status} />
            </div>
          ))}
          {!orders.length && (
            <p className="muted">
              Aquí aparecerán los pedidos de tus clientes.
            </p>
          )}
        </section>
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Editar producto" : "Nuevo producto"}
          close={close}
        >
          <form onSubmit={(e) => void save(e)}>
            <label>
              Nombre
              <input
                name="name"
                defaultValue={editing?.name}
                required
                maxLength={100}
              />
            </label>
            <label>
              Identificador de URL
              <input
                name="slug"
                defaultValue={editing?.slug}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="ventas"
                maxLength={80}
              />
            </label>
            <label>
              Categoría
              <input
                name="category"
                defaultValue={editing?.category}
                required
                maxLength={100}
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                defaultValue={editing?.description}
                required
                maxLength={500}
                rows={3}
              />
            </label>
            <label>
              Precio mensual en soles
              <input
                name="price"
                type="number"
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={editing?.price}
                required
              />
            </label>
            <label>
              URL de acceso al software (opcional)
              <input
                name="app_url"
                type="url"
                pattern="https://.*"
                placeholder="https://mi-software.com"
                defaultValue={editing?.app_url || ""}
              />
            </label>
            <p className="muted small">
              Los nuevos productos se guardan como borrador. Pulsa su estado en
              la tabla para publicarlos.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy ? "Guardando…" : "Guardar producto"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function AdminLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        if (demoMode) {
          if (alive)
            setLicenses(
              readDemo<Order[]>("orders", []).map((o) => ({
                id: `DEMO-${o.id.slice(0, 8)}`,
                product_id: o.product_id,
                product_name: o.product_name,
                status: "demo",
                expires_at: null,
              })),
            );
        } else {
          const { data, error } = await supabase!
            .from("kp_licenses")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          if (alive) setLicenses(data as License[]);
        }
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "Error al cargar licencias.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <>
      <PageHeading title="Licencias y suscripciones">
        Consulta los accesos habilitados de tus clientes.
      </PageHeading>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : licenses.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Licencia</th>
                <th>Producto</th>
                <th>Estado</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.product_name}</td>
                  <td>
                    <Status status={l.status} />
                  </td>
                  <td>
                    {l.expires_at
                      ? new Date(l.expires_at).toLocaleDateString("es-PE")
                      : "Sin vencimiento registrado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Todavía no hay licencias activas">
          <p>Las licencias se registran después de verificar el pago.</p>
        </Empty>
      )}
    </>
  );
}
