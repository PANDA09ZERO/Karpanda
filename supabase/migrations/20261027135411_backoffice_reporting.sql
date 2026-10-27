create function public.kp_dashboard(p_actor uuid,p_from timestamptz,p_to timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare previous_from timestamptz;metrics jsonb;previous_metrics jsonb;series jsonb;top_products jsonb;activity jsonb;expiring jsonb;
begin
 if not exists(select 1 from public.kp_profiles where id=p_actor and role='admin' and active and not must_change_password) then raise exception 'Acceso administrativo requerido';end if;
 if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '366 days' then raise exception 'Selecciona un periodo válido de hasta un año';end if;
 previous_from:=p_from-(p_to-p_from);
 select jsonb_build_object(
 'customers',(select count(*) from public.kp_profiles where role='customer' and created_at>=p_from and created_at<p_to),
 'users',(select count(*) from public.kp_profiles where active),
 'orders',(select count(*) from public.kp_orders where created_at>=p_from and created_at<p_to),
 'pending_amount',(select coalesce(sum(amount),0) from public.kp_orders where status='pending' and created_at>=p_from and created_at<p_to),
 'gross',(select coalesce(sum(amount),0) from public.kp_payments where created_at>=p_from and created_at<p_to),
 'refunds',(select coalesce(sum(amount),0) from public.kp_refunds where created_at>=p_from and created_at<p_to),
 'active_licenses',(select count(*) from public.kp_licenses where status='active' and starts_at<=now() and archived_at is null and (expires_at is null or expires_at>now())),
 'tickets',(select count(*) from public.kp_tickets where status in ('open','in_progress')),
 'unassigned',(select count(*) from public.kp_tickets where assigned_to is null and status in ('open','in_progress')),
 'overdue',(select count(*) from public.kp_tickets where status in ('open','in_progress') and updated_at<now()-interval '48 hours')
 ) into metrics;
 metrics:=metrics||jsonb_build_object('net',(metrics->>'gross')::numeric-(metrics->>'refunds')::numeric);
 select jsonb_build_object(
 'customers',(select count(*) from public.kp_profiles where role='customer' and created_at>=previous_from and created_at<p_from),
 'orders',(select count(*) from public.kp_orders where created_at>=previous_from and created_at<p_from),
 'net',(select coalesce(sum(amount),0) from public.kp_payments where created_at>=previous_from and created_at<p_from)-(select coalesce(sum(amount),0) from public.kp_refunds where created_at>=previous_from and created_at<p_from)
 ) into previous_metrics;
 select coalesce(jsonb_agg(s order by day),'[]'::jsonb) into series from (
  select d::date as day,
   coalesce((select sum(amount) from public.kp_payments where created_at>=p_from and created_at<p_to and (created_at at time zone 'America/Lima')::date=d::date),0) as gross,
   coalesce((select sum(amount) from public.kp_refunds where created_at>=p_from and created_at<p_to and (created_at at time zone 'America/Lima')::date=d::date),0) as refunds
  from generate_series((p_from at time zone 'America/Lima')::date,((p_to-interval '1 millisecond') at time zone 'America/Lima')::date,interval '1 day') d
 ) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into top_products from (
 select o.product_id,o.product_name,count(*) as orders,sum(pay.amount) as amount from public.kp_payments pay join public.kp_orders o on o.id=pay.order_id
 where pay.created_at>=p_from and pay.created_at<p_to group by o.product_id,o.product_name order by amount desc limit 5) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into activity from (
 select a.id,a.entity,a.entity_id,a.action,a.message,a.created_at,p.name as actor_name from public.kp_activity a left join public.kp_profiles p on p.id=a.actor_id order by a.created_at desc limit 10) s;
 select coalesce(jsonb_agg(s),'[]'::jsonb) into expiring from (
 select l.id,l.product_name,l.expires_at,p.name as customer from public.kp_licenses l join public.kp_profiles p on p.id=l.user_id
 where l.archived_at is null and l.status='active' and l.expires_at>now() and l.expires_at<=now()+interval '14 days' order by l.expires_at limit 8) s;
 return jsonb_build_object('metrics',metrics,'previous',previous_metrics,'series',series,'top_products',top_products,'activity',activity,'expiring',expiring,'from',p_from,'to',p_to);
end $$;
revoke all on function public.kp_dashboard(uuid,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.kp_dashboard(uuid,timestamptz,timestamptz) to service_role;

create view public.kp_order_reporting with (security_invoker=true) as
select o.*,p.name as customer_name,p.email as customer_email,pay.created_at as payment_date,r.created_at as refund_date
from public.kp_orders o left join public.kp_profiles p on p.id=o.user_id left join public.kp_payments pay on pay.order_id=o.id left join public.kp_refunds r on r.order_id=o.id;
grant select on public.kp_order_reporting to authenticated,service_role;
revoke select on public.kp_licenses from authenticated;
grant select(id,order_id,user_id,product_id,product_name,status,expires_at,created_at,starts_at,plan_name,user_limit,activation_limit,source,archived_at,updated_at) on public.kp_licenses to authenticated;
revoke select on public.kp_payments,public.kp_refunds from authenticated;
grant select(id,order_id,amount,currency,provider,reference,created_at) on public.kp_payments to authenticated;
grant select(id,order_id,amount,currency,reference,created_at) on public.kp_refunds to authenticated;
