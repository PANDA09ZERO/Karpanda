import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
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
import { Records, InfoGrid, type Column } from "../components/Backoffice";
export function Admin() {
  const { id } = useParams();
  const { refresh, notify } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
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
  const selected = products.find((p) => p.id === id);
  const cols: Column[] = [
    { label: "Producto", render: (r) => r.name },
    { label: "Categoría", render: (r) => r.category },
    { label: "Plan mensual", render: (r) => money(r.price) },
    {
      label: "Estado",
      render: (r) => (
        <span
          className={`state-pill ${r.published ? "state-active" : "state-pending"}`}
        >
          {r.published ? "Publicado" : "Borrador"}
        </span>
      ),
    },
  ];
  return (
    <>
      <div className="office-layout">
        {id && (
          <Link className="text-link" to="/admin/productos">
            ← Volver a productos
          </Link>
        )}
        <div className="office-heading">
          <PageHeading
            eyebrow="CATÁLOGO"
            title={
              id
                ? selected?.name || "Detalle del producto"
                : "Tus productos, listos para crecer."
            }
          >
            {id
              ? "Consulta la información y gestiona la publicación del producto."
              : "Cada producto en su espacio. Toca una tarjeta para conocer sus detalles."}
          </PageHeading>
          {!id && (
            <button className="button" onClick={() => setEditing(null)}>
              <Plus size={18} />
              Nuevo producto
            </button>
          )}
        </div>
        {error && editing === undefined && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <Loading />
        ) : id ? (
          selected ? (
            <div className="office-detail-grid">
              <section className="bento-card">
                <h2>Información del producto</h2>
                <p className="muted">{selected.description}</p>
                <InfoGrid
                  items={[
                    { label: "Nombre", value: selected.name },
                    { label: "Categoría", value: selected.category },
                    { label: "Plan mensual", value: money(selected.price) },
                    {
                      label: "Publicación",
                      value: selected.published
                        ? "Visible en el catálogo"
                        : "Borrador",
                    },
                    {
                      label: "Dirección del software",
                      value: selected.app_url || "Sin configurar",
                    },
                  ]}
                />
                <Link
                  className="text-link product-public-link"
                  to={`/producto/${selected.slug}`}
                >
                  Ver página pública <ArrowRight size={16} />
                </Link>
              </section>
              <aside className="bento-card action-panel">
                <h2>Gestionar producto</h2>
                <button
                  className="button"
                  onClick={() => {
                    setEditing(selected);
                    setError("");
                  }}
                >
                  Editar producto <Pencil size={16} />
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void toggle(selected)}
                  aria-label={`${selected.published ? "Retirar" : "Publicar"} ${selected.name}`}
                >
                  {selected.published
                    ? "Retirar del catálogo"
                    : "Publicar en catálogo"}
                </button>
                <small className="muted">
                  Retirar un producto conserva los pedidos y las licencias
                  existentes.
                </small>
              </aside>
            </div>
          ) : (
            <Empty title="Producto no encontrado">
              <Link className="text-link" to="/admin/productos">
                Ver productos
              </Link>
            </Empty>
          )
        ) : products.length ? (
          <Records
            items={products}
            columns={cols}
            base="/admin/productos"
            title={(r) => r.name}
          />
        ) : (
          <Empty title="Añade tu primer producto" />
        )}
      </div>
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
