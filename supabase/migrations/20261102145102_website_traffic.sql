-- Aggregate, consented public-site measurement. Raw IPs and form contents are never stored.
create table kp_private.traffic_meta(id boolean primary key default true check(id),started_at timestamptz not null default now());
insert into kp_private.traffic_meta(id) values(true);
create table kp_private.traffic_sessions(day date not null,session_hash text not null check(length(session_hash)=64),source text not null,device text not null,first_seen timestamptz not null default now(),last_seen timestamptz not null default now(),primary key(day,session_hash));
create index traffic_sessions_seen_idx on kp_private.traffic_sessions(last_seen);
create table kp_private.traffic_totals(day date not null,path text not null,source text not null,device text not null,views bigint not null default 0,demo_starts bigint not null default 0,demo_steps bigint not null default 0,demo_completions bigint not null default 0,demo_resets bigint not null default 0,demo_consults bigint not null default 0,primary key(day,path,source,device));
create table kp_private.traffic_receipts(id uuid primary key,created_at timestamptz not null default now());
create index traffic_receipts_created_idx on kp_private.traffic_receipts(created_at);
create table kp_private.traffic_limits(bucket timestamptz not null,ip_hash text not null check(length(ip_hash)=64),requests integer not null default 1,primary key(bucket,ip_hash));
alter table kp_private.traffic_meta enable row level security;
alter table kp_private.traffic_sessions enable row level security;
alter table kp_private.traffic_totals enable row level security;
alter table kp_private.traffic_receipts enable row level security;
alter table kp_private.traffic_limits enable row level security;
revoke all on kp_private.traffic_meta,kp_private.traffic_sessions,kp_private.traffic_totals,kp_private.traffic_receipts,kp_private.traffic_limits from public,anon,authenticated;
grant all on kp_private.traffic_meta,kp_private.traffic_sessions,kp_private.traffic_totals,kp_private.traffic_receipts,kp_private.traffic_limits to service_role;

create function public.kp_record_traffic(p_id uuid,p_session_hash text,p_ip_hash text,p_path text,p_event text,p_source text,p_device text) returns boolean language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'America/Lima')::date; requests integer;
begin
 if p_path not in ('/','/servicios','/como-funciona','/terminos','/demos','/demo/ventas','/demo/reservas') and p_path!~'^/producto/[a-z0-9-]{1,80}$' then raise exception 'Ruta no permitida';end if;
 if p_event not in ('page_view','demo_start','demo_step','demo_complete','demo_reset','demo_consult') or (p_event<>'page_view' and p_path not in ('/demo/ventas','/demo/reservas')) then raise exception 'Evento no permitido';end if;
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

create function public.kp_traffic_report(p_actor uuid,p_days integer default 30) returns jsonb language plpgsql security invoker set search_path='' as $$
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
 select coalesce(jsonb_agg(s),'[]'::jsonb) into demos from (select path,sum(demo_starts) as starts,sum(demo_completions) as completions,sum(demo_consults) as consults from kp_private.traffic_totals where day between first_day and last_day and path in ('/demo/ventas','/demo/reservas') group by path order by path) s;
 return jsonb_build_object('source','karpanda','started_at',started,'generated_at',now(),'days',p_days,'from',first_day,'to',last_day,'metrics',metrics,'series',series,'pages',pages,'sources',sources,'devices',devices,'demos',demos);
end $$;
revoke all on function public.kp_traffic_report(uuid,integer) from public,anon,authenticated;
grant execute on function public.kp_traffic_report(uuid,integer) to service_role;
