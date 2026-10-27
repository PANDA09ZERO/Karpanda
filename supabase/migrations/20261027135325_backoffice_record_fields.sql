alter table public.kp_orders add column currency text not null default 'PEN' check(currency='PEN'),add column quantity integer not null default 1 check(quantity between 1 and 1000),add column unit_price numeric(10,2),add column subtotal numeric(10,2),add column tax numeric(10,2) not null default 0 check(tax>=0),add column plan_name text not null default 'Plan Empresa',add column updated_at timestamptz not null default now();
update public.kp_orders set unit_price=amount,subtotal=amount;
alter table public.kp_orders alter column unit_price set not null,alter column subtotal set not null;
alter table public.kp_orders add constraint kp_order_totals check(amount=subtotal+tax and subtotal=unit_price*quantity);
create or replace function public.kp_prepare_order() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.kp_products;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para crear un pedido'; end if;
 select * into p from public.kp_products where id=new.product_id and published;
 if not found then raise exception 'El producto no está disponible'; end if;
 new.user_id:=auth.uid();new.quantity:=1;new.unit_price:=p.price;new.subtotal:=p.price;new.tax:=0;new.amount:=p.price;new.currency:='PEN';new.plan_name:='Plan Empresa';new.product_name:=p.name;new.status:='pending';
 return new;
end $$;
alter table public.kp_licenses alter column order_id drop not null;
alter table public.kp_licenses drop constraint kp_licenses_status_check;
alter table public.kp_licenses add constraint kp_license_status check(status in ('active','suspended','expired','revoked'));
alter table public.kp_licenses add column starts_at timestamptz not null default now(),add column plan_name text not null default 'Plan Empresa',add column user_limit integer not null default 5 check(user_limit between 1 and 10000),add column activation_limit integer not null default 1 check(activation_limit between 1 and 10000),add column source text not null default 'manual' check(source in ('manual','payment')),add column notes text not null default '',add column archived_at timestamptz,add column updated_at timestamptz not null default now();
update public.kp_licenses set source='payment' where order_id is not null;
alter table public.kp_licenses add constraint kp_license_dates check(expires_at is null or expires_at>starts_at);
create table public.kp_payments (
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.kp_orders(id),
 amount numeric(10,2) not null check(amount>0),currency text not null default 'PEN' check(currency='PEN'),
 provider text not null default 'manual',reference text not null check(length(reference) between 3 and 160),
 reason text not null check(length(reason) between 3 and 2000),actor_id uuid not null references public.kp_profiles(id),created_at timestamptz not null default now(),unique(provider,reference)
);
create index kp_payments_actor_idx on public.kp_payments(actor_id);
create table public.kp_refunds (
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.kp_orders(id),
 amount numeric(10,2) not null check(amount>0),currency text not null default 'PEN' check(currency='PEN'),
 reference text not null unique check(length(reference) between 3 and 160),reason text not null check(length(reason) between 3 and 2000),
 actor_id uuid not null references public.kp_profiles(id),created_at timestamptz not null default now()
);
create index kp_refunds_actor_idx on public.kp_refunds(actor_id);

alter table public.kp_tickets drop constraint kp_tickets_status_check;
alter table public.kp_tickets add constraint kp_ticket_status check(status in ('open','in_progress','resolved','closed'));
alter table public.kp_tickets add column priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),add column assigned_to uuid references public.kp_profiles(id),add column product_id uuid references public.kp_products(id),add column license_id uuid references public.kp_licenses(id),add column updated_at timestamptz not null default now(),add column resolved_at timestamptz;
create index kp_tickets_assignee_idx on public.kp_tickets(assigned_to);
create index kp_tickets_product_idx on public.kp_tickets(product_id);
create index kp_tickets_license_idx on public.kp_tickets(license_id);
create table public.kp_ticket_messages (
 id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.kp_tickets(id),
 author_id uuid not null references public.kp_profiles(id),body text not null check(length(body) between 2 and 5000),
 internal boolean not null default false,created_at timestamptz not null default now()
);
create index kp_ticket_messages_ticket_idx on public.kp_ticket_messages(ticket_id,created_at);
create index kp_ticket_messages_author_idx on public.kp_ticket_messages(author_id);
create index kp_licenses_expiry_idx on public.kp_licenses(expires_at) where status='active' and archived_at is null;
create index kp_orders_created_idx on public.kp_orders(created_at desc);
create index kp_tickets_updated_idx on public.kp_tickets(updated_at desc);
