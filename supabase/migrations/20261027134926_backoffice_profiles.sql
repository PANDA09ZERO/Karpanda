create schema if not exists kp_private;
revoke all on schema kp_private from public;
grant usage on schema kp_private to authenticated, service_role, supabase_auth_admin;

create table public.kp_profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 email text not null, name text not null, company text not null default '', phone text not null default '',
 role text not null default 'customer' check(role in ('admin','pending_admin','customer')),
 active boolean not null default true, must_change_password boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_sign_in_at timestamptz
);
insert into public.kp_profiles(id,email,name,company,phone,role,active,must_change_password,created_at,last_sign_in_at)
select id,coalesce(email,''),coalesce(raw_user_meta_data->>'name',split_part(email,'@',1),''),coalesce(raw_user_meta_data->>'company',''),coalesce(raw_user_meta_data->>'phone',''),
 case when raw_app_meta_data->>'role' in ('admin','pending_admin') then raw_app_meta_data->>'role' else 'customer' end,
 banned_until is null or banned_until<=now(),coalesce((raw_app_meta_data->>'must_change_password')::boolean,false),created_at,last_sign_in_at from auth.users;

create function kp_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.kp_profiles where id=auth.uid() and role='admin' and active and not must_change_password)
$$;
create function kp_private.account_ready() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.kp_profiles where id=auth.uid() and active and not must_change_password)
$$;
revoke all on function kp_private.is_admin(),kp_private.account_ready() from public;
grant execute on function kp_private.is_admin(),kp_private.account_ready() to authenticated;

create table public.kp_activity (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.kp_profiles(id),
 owner_id uuid references public.kp_profiles(id), entity text not null, entity_id uuid not null,
 action text not null, message text not null default '', internal boolean not null default true,
 changes jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index kp_activity_entity_idx on public.kp_activity(entity,entity_id,created_at desc);
create index kp_activity_owner_idx on public.kp_activity(owner_id);
create index kp_activity_actor_idx on public.kp_activity(actor_id);
create index kp_profiles_role_idx on public.kp_profiles(role,active);

create function kp_private.sync_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare previous jsonb; current_profile jsonb; actor uuid;
begin
 select to_jsonb(p) into previous from public.kp_profiles p where id=new.id;
 insert into public.kp_profiles(id,email,name,company,phone,role,active,must_change_password,created_at,last_sign_in_at)
 values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1),''),coalesce(new.raw_user_meta_data->>'company',''),coalesce(new.raw_user_meta_data->>'phone',''),
 case when new.raw_app_meta_data->>'role' in ('admin','pending_admin') then new.raw_app_meta_data->>'role' else 'customer' end,
 new.banned_until is null or new.banned_until<=now(),coalesce((new.raw_app_meta_data->>'must_change_password')::boolean,false),new.created_at,new.last_sign_in_at)
 on conflict(id) do update set email=excluded.email,name=excluded.name,company=excluded.company,phone=excluded.phone,role=excluded.role,active=excluded.active,must_change_password=excluded.must_change_password,last_sign_in_at=excluded.last_sign_in_at,updated_at=now();
 select to_jsonb(p) - 'last_sign_in_at' - 'updated_at' into current_profile from public.kp_profiles p where id=new.id;
 previous := previous - 'last_sign_in_at' - 'updated_at';
 if previous is distinct from current_profile then
  if (tg_op='INSERT' or new.raw_app_meta_data->>'operation_id' is distinct from old.raw_app_meta_data->>'operation_id') and new.raw_app_meta_data->>'actor_id' ~ '^[0-9a-f-]{36}$' then
    actor:=(new.raw_app_meta_data->>'actor_id')::uuid;
    if not exists(select 1 from public.kp_profiles where id=actor) then actor:=null; end if;
  else actor:=new.id; end if;
  insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,changes)
  values(actor,new.id,'users',new.id,case when previous is null then 'user.created' else 'user.updated' end,'Datos o acceso de la cuenta actualizados',jsonb_build_object('before',previous,'after',current_profile));
 end if;
 return new;
end $$;
revoke all on function kp_private.sync_profile() from public;
create trigger kp_sync_profile after insert or update on auth.users for each row execute function kp_private.sync_profile();

create function kp_private.protect_last_admin() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.raw_app_meta_data->>'role'='admin' and (old.banned_until is null or old.banned_until<=now()) and
 (tg_op='DELETE' or new.raw_app_meta_data->>'role' is distinct from 'admin' or new.banned_until>now() or coalesce((new.raw_app_meta_data->>'must_change_password')::boolean,false)) then
  perform pg_advisory_xact_lock(174552001);
  if not exists(select 1 from auth.users u where u.id<>old.id and u.raw_app_meta_data->>'role'='admin' and (u.banned_until is null or u.banned_until<=now()) and not coalesce((u.raw_app_meta_data->>'must_change_password')::boolean,false)) then
   raise exception 'Debe quedar al menos un administrador activo con contraseña personal';
  end if;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
revoke all on function kp_private.protect_last_admin() from public;
create trigger kp_protect_last_admin before update or delete on auth.users for each row execute function kp_private.protect_last_admin();
