-- Karpanda: additive schema, isolated by kp_ prefix.
create table public.kp_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 100),
  category text not null,
  description text not null,
  price numeric(10,2) not null check (price > 0),
  published boolean not null default false,
  app_url text check (app_url is null or app_url ~ '^https://'),
  created_at timestamptz not null default now()
);
create table public.kp_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.kp_products(id),
  buyer_name text not null check (length(buyer_name) between 2 and 160),
  product_name text not null,
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  created_at timestamptz not null default now()
);
create table public.kp_licenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.kp_orders(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.kp_products(id),
  product_name text not null,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.kp_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (length(subject) between 3 and 160),
  message text not null check (length(message) between 10 and 5000),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create table public.kp_releases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.kp_products(id),
  version text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  check (split_part(storage_path,'/',1) = product_id::text)
);
create index kp_orders_user_idx on public.kp_orders(user_id);
create index kp_orders_product_idx on public.kp_orders(product_id);
create index kp_licenses_user_product_idx on public.kp_licenses(user_id,product_id);
create index kp_licenses_product_idx on public.kp_licenses(product_id);
create index kp_tickets_user_idx on public.kp_tickets(user_id);
create index kp_releases_product_idx on public.kp_releases(product_id);
alter table public.kp_products enable row level security;
alter table public.kp_orders enable row level security;
alter table public.kp_licenses enable row level security;
alter table public.kp_tickets enable row level security;
alter table public.kp_releases enable row level security;

create policy "Read published products" on public.kp_products for select to anon, authenticated using (published);
create policy "Read licensed products" on public.kp_products for select to authenticated
using (exists (
  select 1 from public.kp_licenses l where l.product_id=kp_products.id and l.user_id=(select auth.uid())
));
create policy "Administrators manage products" on public.kp_products for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Owners or administrators read orders" on public.kp_orders for select to authenticated
using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Owners create pending orders" on public.kp_orders for insert to authenticated
with check ((select auth.uid())=user_id and status='pending');
create policy "Owners or administrators read licenses" on public.kp_licenses for select to authenticated
using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Owners or administrators read tickets" on public.kp_tickets for select to authenticated
using ((select auth.uid())=user_id or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Owners create tickets" on public.kp_tickets for insert to authenticated
with check ((select auth.uid())=user_id and status='open');
create policy "Administrators resolve tickets" on public.kp_tickets for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "Licensed users read releases" on public.kp_releases for select to authenticated
using ((select auth.jwt()->'app_metadata'->>'role')='admin' or exists (
  select 1 from public.kp_licenses l where l.product_id=kp_releases.product_id and l.user_id=(select auth.uid())
  and l.status='active' and (l.expires_at is null or l.expires_at>now())
));
create policy "Administrators manage releases" on public.kp_releases for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role')='admin') with check ((select auth.jwt()->'app_metadata'->>'role')='admin');

-- Enforce authoritative prices and owner identity even on direct Data API inserts.
create function public.kp_prepare_order() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.kp_products;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para crear un pedido'; end if;
  select * into p from public.kp_products where id=new.product_id and published;
  if not found then raise exception 'El producto no está disponible'; end if;
  new.user_id:=auth.uid(); new.amount:=p.price; new.product_name:=p.name; new.status:='pending';
  return new;
end; $$;
create trigger kp_orders_prepare before insert on public.kp_orders for each row execute function public.kp_prepare_order();
revoke all on function public.kp_prepare_order() from public,anon,authenticated;

create function public.kp_create_order(p_product_id uuid,p_buyer_name text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result public.kp_orders;
begin
  insert into public.kp_orders(user_id,product_id,buyer_name) values(auth.uid(),p_product_id,trim(p_buyer_name)) returning * into result;
  return to_jsonb(result);
end; $$;
revoke all on function public.kp_create_order(uuid,text) from public,anon;
grant execute on function public.kp_create_order(uuid,text) to authenticated;

-- Explicit grants: browser clients cannot choose prices, mark payments or issue licenses.
revoke all on public.kp_products,public.kp_orders,public.kp_licenses,public.kp_tickets,public.kp_releases from anon,authenticated;
grant select on public.kp_products to anon,authenticated;
grant insert,update,delete on public.kp_products to authenticated;
grant select on public.kp_orders,public.kp_licenses,public.kp_tickets,public.kp_releases to authenticated;
grant insert(user_id,product_id,buyer_name) on public.kp_orders to authenticated;
grant insert(user_id,subject,message) on public.kp_tickets to authenticated;
grant update(status) on public.kp_tickets to authenticated;
grant insert,update,delete on public.kp_releases to authenticated;
grant all on public.kp_products,public.kp_orders,public.kp_licenses,public.kp_tickets,public.kp_releases to service_role;

insert into public.kp_products(id,slug,name,category,description,price,published) values
('11111111-1111-4111-8111-111111111111','ventas','Karpanda Ventas','Ventas e inventario','Controla tu caja, productos y ventas.',199,true),
('22222222-2222-4222-8222-222222222222','reservas','Karpanda Reservas','Citas y servicios','Tu agenda y tus clientes, en orden.',149,true),
('33333333-3333-4333-8333-333333333333','gestion','Karpanda Gestión','Operación de negocios','Conecta clientes, tareas y reportes.',249,true);

insert into storage.buckets(id,name,public) values('kp-downloads','kp-downloads',false) on conflict(id) do nothing;
create policy "Download with active Karpanda license" on storage.objects for select to authenticated
using (bucket_id='kp-downloads' and exists (
  select 1 from public.kp_licenses l where l.product_id::text=(storage.foldername(name))[1]
  and l.user_id=(select auth.uid()) and l.status='active' and (l.expires_at is null or l.expires_at>now())
));
