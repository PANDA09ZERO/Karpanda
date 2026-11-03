import { demoMode, supabase } from "./supabase";
import type { Product, Order, Ticket } from "../types";
import { quoteProduct } from "./catalog";
export const seedProducts: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "ventas",
    demo_path: "/demo/ventas",
    name: "Karpanda Ventas",
    category: "Ventas e inventario",
    description: "Controla tu caja, productos y ventas.",
    price: 199,
    published: true,
    app_url: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "reservas",
    demo_path: "/demo/reservas",
    name: "Karpanda Reservas",
    category: "Citas y servicios",
    description: "Tu agenda y tus clientes, en orden.",
    price: 149,
    published: true,
    app_url: null,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "gestion",
    demo_path: "/demo/gestion",
    name: "Karpanda Gestión",
    category: "Operación de negocios",
    description: "Conecta clientes, tareas y reportes.",
    price: 249,
    published: true,
    app_url: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "educacion",
    name: "Karpanda Educación",
    category: "Educación",
    description:
      "Conecta alumnos, profesores, familias, matrículas y seguimiento académico.",
    price: 0,
    published: true,
    app_url: null,
    demo_path: "/demo/educacion",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    slug: "landing-corporativa",
    name: "Página web corporativa",
    category: "Landing pages",
    description:
      "Una página clara y profesional para presentar tu negocio y captar contactos.",
    price: 299,
    published: true,
    app_url: null,
    demo_path: null,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    slug: "landing-campana",
    name: "Landing de campaña",
    category: "Landing pages",
    description:
      "Landing enfocada en una oferta o campaña para convertir visitas en consultas.",
    price: 199,
    published: true,
    app_url: null,
    demo_path: null,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    slug: "landing-catalogo",
    name: "Catálogo web",
    category: "Landing pages",
    description:
      "Catálogo de productos o servicios con información clara y contacto directo.",
    price: 249,
    published: true,
    app_url: null,
    demo_path: null,
  },
];
export const money = (n: number) => `S/ ${Number(n).toFixed(2)}`;
export function readDemo<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`karpanda:v1:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function saveDemo(key: string, value: unknown) {
  localStorage.setItem(`karpanda:v1:${key}`, JSON.stringify(value));
}
export async function loadProducts(admin = false): Promise<Product[]> {
  if (demoMode)
    return readDemo<Product[]>("products", seedProducts).filter(
      (p) => admin || p.published,
    );
  if (!supabase) throw new Error("Supabase no está configurado.");
  let query = supabase.from("kp_products").select("*").order("created_at");
  if (!admin) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  const base = (data as Product[]) || [];
  const slugs = new Set(base.map((p) => p.slug));
  const staticLanding = seedProducts.filter(
    (p) => p.category === "Landing pages" && !slugs.has(p.slug),
  );
  const extras = admin
    ? staticLanding
    : staticLanding.filter((p) => p.published);
  return [...base, ...extras] as Product[];
}
export async function placeOrder(
  product: Product,
  buyer: string,
): Promise<Order> {
  if (quoteProduct(product))
    throw Error(
      "Este producto requiere cotización. Consulta su implementación antes de registrar un pedido.",
    );
  if (demoMode) {
    const order: Order = {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      amount: product.price,
      status: "demo",
      created_at: new Date().toISOString(),
    };
    saveDemo("orders", [order, ...readDemo<Order[]>("orders", [])]);
    return order;
  }
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.rpc("kp_create_order", {
    p_product_id: product.id,
    p_buyer_name: buyer,
  });
  if (error) throw error;
  return data as Order;
}
export async function loadOrders(admin = false): Promise<Order[]> {
  if (demoMode) return readDemo<Order[]>("orders", []);
  if (!supabase) throw new Error("Supabase no está configurado.");
  let query = supabase
    .from("kp_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (!admin) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return [];
    query = query.eq("user_id", data.user.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}
export async function createTicket(
  subject: string,
  message: string,
  userId?: string,
) {
  if (demoMode) {
    const t: Ticket = {
      id: crypto.randomUUID(),
      subject,
      message,
      status: "open",
      created_at: new Date().toISOString(),
    };
    saveDemo("tickets", [t, ...readDemo<Ticket[]>("tickets", [])]);
    return;
  }
  if (!supabase || !userId)
    throw new Error("Inicia sesión para enviar una solicitud.");
  const { error } = await supabase
    .from("kp_tickets")
    .insert({ user_id: userId, subject, message });
  if (error) throw error;
}
