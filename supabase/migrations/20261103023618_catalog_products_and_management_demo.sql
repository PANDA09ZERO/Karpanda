-- Real catalog records and editable public demo links. Zero means quotation, never a free checkout.
alter table public.kp_products drop constraint kp_products_price_check;
alter table public.kp_products add constraint kp_products_price_check check(price>=0);
alter table public.kp_products add column demo_path text check(demo_path is null or demo_path in ('/demo/ventas','/demo/reservas','/demo/educacion','/demo/gestion'));
update public.kp_products set demo_path='/demo/'||slug where slug in ('ventas','reservas','gestion') and demo_path is null;
insert into public.kp_products(id,slug,name,category,description,price,published,app_url,demo_path)
values('44444444-4444-4444-8444-444444444444','educacion','Karpanda Educación','Educación','Conecta alumnos, profesores, familias, matrículas y seguimiento académico.',0,true,null,'/demo/educacion') on conflict(slug) do nothing;
create or replace function public.kp_prepare_order() returns trigger language plpgsql set search_path='' as $$
declare p public.kp_products;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para crear un pedido'; end if;
 select * into p from public.kp_products where id=new.product_id and published;
 if not found then raise exception 'El producto no está disponible'; end if;
 if p.price<=0 then raise exception 'Este producto requiere cotización antes de registrar un pedido';end if;
 new.user_id:=auth.uid();new.quantity:=1;new.unit_price:=p.price;new.subtotal:=p.price;new.tax:=0;new.amount:=p.price;new.currency:='PEN';new.plan_name:='Plan Empresa';new.product_name:=p.name;new.status:='pending';
 return new;
end $$;

-- Extend existing consented measurement to the education demo; preserve access restrictions.
create or replace function public.kp_record_traffic(p_id uuid,p_session_hash text,p_ip_hash text,p_path text,p_event text,p_source text,p_device text) returns boolean language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'America/Lima')::date; requests integer;
begin
 if p_path not in ('/','/servicios','/como-funciona','/terminos','/demos','/demo/ventas','/demo/reservas','/demo/educacion','/demo/gestion') and p_path!~'^/producto/[a-z0-9-]{1,80}$' then raise exception 'Ruta no permitida';end if;
 if p_event not in ('page_view','demo_start','demo_step','demo_complete','demo_reset','demo_consult') or (p_event<>'page_view' and p_path not in ('/demo/ventas','/demo/reservas','/demo/educacion','/demo/gestion')) then raise exception 'Evento no permitido';end if;
 if p_source not in ('direct','search','social','referral') or p_device not in ('mobile','tablet','desktop') then raise exception 'Dimensión no permitida';end if;
 if p_id is null or p_session_hash is null or p_ip_hash is null then raise exception 'Identificadores requeridos';end if;
 insert into kp_private.traffic_limits(bucket,ip_hash) values(date_trunc('minute',now()),p_ip_hash) on conflict(bucket,ip_hash) do update set requests=least(121,traffic_limits.requests+1) returning traffic_limits.requests into requests;
 if requests>120 then return false;end if;
 insert into kp_private.traffic_receipts(id) values(p_id) on conflict do nothing;
 if not found then return false;end if;
 insert into kp_private.traffic_sessions(day,session_hash,source,device) values(today,p_session_hash,p_source,p_device) on conflict(day,session_hash) do update set last_seen=now();
 insert into kp_private.traffic_totals(day,path,source,device,views,demo_starts,demo_steps,demo_completions,demo_resets,demo_consults)
 values(today,p_path,p_source,p_device,(p_event='page_view')::integer,(p_event='demo_start')::integer,(p_event='demo_step')::integer,(p_event='demo_complete')::integer,(p_event='demo_reset')::integer,(p_event='demo_consult')::integer)
 on conflict(day,path,source,device) do update set views=traffic_totals.views+excluded.views,demo_starts=traffic_totals.demo_starts+excluded.demo_starts,demo_steps=traffic_totals.demo_steps+excluded.demo_steps,demo_completions=traffic_totals.demo_completions+excluded.demo_completions,demo_resets=traffic_totals.demo_resets+excluded.demo_resets,demo_consults=traffic_totals.demo_consults+excluded.demo_consults;
 delete from kp_private.traffic_limits where bucket<now()-interval '2 hours';
 delete from kp_private.traffic_receipts where created_at<now()-interval '7 days';
 delete from kp_private.traffic_sessions where day<today-90;
 return true;
end $$;
revoke all on function public.kp_record_traffic(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.kp_record_traffic(uuid,text,text,text,text,text,text) to service_role;

create or replace function public.kp_traffic_report(p_actor uuid,p_days integer default 30) returns jsonb language plpgsql security invoker set search_path='' as $$
declare first_day date;last_day date:=(now() at time zone 'America/Lima')::date;metrics jsonb;series jsonb;pages jsonb;sources jsonb;devices jsonb;demos jsonb;started timestamptz;
begin
 if not exists(select 1 from public.kp_profiles where id=p_actor and role='admin' and active and not must_change_password) then raise exception 'Acceso administrativo requerido';end if;
 if p_days is null or p_days<1 or p_days>90 then raise exception 'Periodo no válido';end if;
 first_day:=last_day-p_days+1;
 select started_at into started from kp_private.traffic_meta where id;
 select jsonb_build_object('views',coalesce(sum(views),0),'starts',coalesce(sum(demo_starts),0),'completions',coalesce(sum(demo_completions),0),'consults',coalesce(sum(demo_consults),0),'sessions',(select count(*) from kp_private.traffic_sessions where day between first_day and last_day),'recent_sessions',(select count(*) from kp_private.traffic_sessions where last_seen>=now()-interval '30 minutes')) into metrics from kp_private.traffic_totals where day between first_day and last_day;
 select coalesce(jsonb_agg(s order by day),'[]'::jsonb) into series from (select d::date as day,coalesce((select sum(t.views) from kp_private.traffic_totals t where t.day=d::date),0) as views,(select count(*) from kp_private.traffic_sessions where day=d::date) as sessions from generate_series(first_day,last_day,interval '1 day') d) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into pages from (select path,sum(views) as views from kp_private.traffic_totals where day between first_day and last_day group by path having sum(views)>0 order by views desc,path limit 12) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into sources from (select source,count(*) as sessions from kp_private.traffic_sessions where day between first_day and last_day group by source order by sessions desc) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into devices from (select device,count(*) as sessions from kp_private.traffic_sessions where day between first_day and last_day group by device order by sessions desc) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into demos from (select path,sum(demo_starts) as starts,sum(demo_completions) as completions,sum(demo_consults) as consults from kp_private.traffic_totals where day between first_day and last_day and path in ('/demo/ventas','/demo/reservas','/demo/educacion','/demo/gestion') group by path order by path) s;
 return jsonb_build_object('source','karpanda','started_at',started,'generated_at',now(),'days',p_days,'from',first_day,'to',last_day,'metrics',metrics,'series',series,'pages',pages,'sources',sources,'devices',devices,'demos',demos);
end $$;
revoke all on function public.kp_traffic_report(uuid,integer) from public,anon,authenticated;
grant execute on function public.kp_traffic_report(uuid,integer) to service_role;
