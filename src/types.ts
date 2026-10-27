export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  published: boolean;
  app_url: string | null;
};
export type Order = {
  id: string;
  user_id?: string;
  product_id: string;
  product_name: string;
  amount: number;
  status: "pending" | "paid" | "demo";
  created_at: string;
};
export type License = {
  id: string;
  product_id: string;
  product_name: string;
  status: string;
  expires_at: string | null;
  app_url?: string | null;
  starts_at?: string;
  archived_at?: string | null;
  plan_name?: string;
  user_limit?: number;
};
export type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};
