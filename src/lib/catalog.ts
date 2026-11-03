import type { Product } from "../types";
export const productDemos = [
  { path: "/demo/ventas", label: "Ventas e inventario" },
  { path: "/demo/reservas", label: "Reservas y citas" },
  { path: "/demo/educacion", label: "Gestión educativa" },
  { path: "/demo/gestion", label: "Gestión de negocios" },
];
export function productDemo(product: Product) {
  if (product.demo_path !== undefined)
    return productDemos.some((d) => d.path === product.demo_path)
      ? product.demo_path
      : null;
  return (
    productDemos.find((d) => d.path === `/demo/${product.slug}`)?.path || null
  );
}
export const quoteProduct = (product: Product) => Number(product.price) <= 0;
