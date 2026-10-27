create function public.kp_admin_action(p_actor uuid,p_module text,p_action text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.kp_orders;l public.kp_licenses;p public.kp_products;reason text;reference text;eid uuid;result jsonb;new_expiry timestamptz;
begin
 if not exists(select 1 from public.kp_profiles where id=p_actor and role='admin' and active and not must_change_password) then raise exception 'Acceso administrativo requerido';end if;
 perform set_config('karpanda.actor',p_actor::text,true);
 reason:=trim(coalesce(p_payload->>'reason',''));
 if length(reason)<3 or length(reason)>2000 then raise exception 'Indica un motivo entre 3 y 2000 caracteres';end if;
 if p_module='orders' then
  select * into o from public.kp_orders where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'Pedido no encontrado';end if;
  eid:=o.id;
  if p_action='confirm_payment' then
   if o.status='paid' then return to_jsonb(o);end if;
   if o.status<>'pending' then raise exception 'Solo se confirman pedidos pendientes';end if;
   if p_payload->>'acknowledged' is distinct from 'true' then raise exception 'Confirma que el pago ya fue recibido fuera del sistema';end if;
   reference:=trim(coalesce(p_payload->>'reference',''));
   if length(reference)<3 or length(reference)>160 then raise exception 'Indica la referencia del pago';end if;
   insert into public.kp_payments(order_id,amount,currency,reference,reason,actor_id) values(o.id,o.amount,o.currency,reference,reason,p_actor);
   update public.kp_orders set status='paid',updated_at=now() where id=o.id returning * into o;
   insert into public.kp_licenses(order_id,user_id,product_id,product_name,plan_name,source,notes,expires_at) values(o.id,o.user_id,o.product_id,o.product_name,o.plan_name,'payment','Emitida por pago confirmado',now()+interval '1 month') on conflict(order_id) do nothing;
  elsif p_action='cancel' then
   if o.status<>'pending' then raise exception 'Solo se pueden cancelar pedidos pendientes';end if;
   update public.kp_orders set status='cancelled',updated_at=now() where id=o.id returning * into o;
  elsif p_action='refund_manual' then
   if o.status='refunded' then return to_jsonb(o);end if;
   if o.status<>'paid' then raise exception 'Solo se registra devolución de un pedido pagado';end if;
   if p_payload->>'acknowledged' is distinct from 'true' then raise exception 'Confirma que ya se realizó la devolución fuera del sistema';end if;
   reference:=trim(coalesce(p_payload->>'reference',''));
   if length(reference)<3 or length(reference)>160 then raise exception 'Indica la referencia de la devolución';end if;
   insert into public.kp_refunds(order_id,amount,currency,reference,reason,actor_id) values(o.id,o.amount,o.currency,reference,reason,p_actor);
   update public.kp_orders set status='refunded',updated_at=now() where id=o.id returning * into o;
   update public.kp_licenses set status='revoked',updated_at=now() where order_id=o.id;
  elsif p_action<>'note' then raise exception 'Acción de pedido no disponible';end if;
  insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,internal,changes) values(p_actor,o.user_id,'orders',o.id,'order.'||p_action,reason,true,jsonb_build_object('reference',reference));
  if p_action<>'note' then insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,internal,changes) values(p_actor,o.user_id,'orders',o.id,'order.status','Estado actualizado: '||o.status,false,jsonb_build_object('status',o.status));end if;
  return to_jsonb(o);
 elsif p_module='licenses' then
  if p_action='create' then
   select * into p from public.kp_products where id=(p_payload->>'product_id')::uuid;
   if not found then raise exception 'Producto no encontrado';end if;
   if not exists(select 1 from public.kp_profiles where id=(p_payload->>'user_id')::uuid and active) then raise exception 'Cliente no disponible';end if;
   if nullif(p_payload->>'order_id','') is not null then
    select * into o from public.kp_orders where id=(p_payload->>'order_id')::uuid for update;
    if not found or o.status<>'paid' or o.user_id<>(p_payload->>'user_id')::uuid or o.product_id<>p.id then raise exception 'El pedido debe estar pagado y corresponder al cliente y producto';end if;
   end if;
   insert into public.kp_licenses(user_id,product_id,product_name,order_id,source,plan_name,starts_at,expires_at,user_limit,activation_limit,notes)
   values((p_payload->>'user_id')::uuid,p.id,p.name,nullif(p_payload->>'order_id','')::uuid,case when nullif(p_payload->>'order_id','') is null then 'manual' else 'payment' end,coalesce(nullif(trim(p_payload->>'plan_name'),''),'Plan Empresa'),coalesce(nullif(p_payload->>'starts_at','')::timestamptz,now()),nullif(p_payload->>'expires_at','')::timestamptz,coalesce((p_payload->>'user_limit')::integer,5),coalesce((p_payload->>'activation_limit')::integer,1),reason) returning * into l;
  else
   select * into l from public.kp_licenses where id=(p_payload->>'id')::uuid for update;
   if not found then raise exception 'Licencia no encontrada';end if;
   if l.archived_at is not null and p_action<>'restore' then raise exception 'Restaura la licencia antes de modificarla';end if;
   if p_action='edit' then
    update public.kp_licenses set plan_name=coalesce(nullif(trim(p_payload->>'plan_name'),''),plan_name),expires_at=nullif(p_payload->>'expires_at','')::timestamptz,user_limit=coalesce((p_payload->>'user_limit')::integer,user_limit),activation_limit=coalesce((p_payload->>'activation_limit')::integer,activation_limit),notes=reason,updated_at=now() where id=l.id returning * into l;
   elsif p_action='renew' then
    new_expiry:=(p_payload->>'expires_at')::timestamptz;
    if new_expiry is null or new_expiry<=greatest(coalesce(l.expires_at,now()),now()) then raise exception 'La renovación debe extender la vigencia actual';end if;
    update public.kp_licenses set expires_at=new_expiry,status='active',updated_at=now() where id=l.id returning * into l;
   elsif p_action in ('suspend','revoke','reactivate','archive','restore') then
    if p_action='reactivate' and l.expires_at<=now() then raise exception 'Renueva la licencia vencida antes de activarla';end if;
    update public.kp_licenses set status=case when p_action='reactivate' then 'active' when p_action in ('suspend','restore') then 'suspended' else 'revoked' end,
    archived_at=case when p_action='archive' then now() when p_action='restore' then null else archived_at end,updated_at=now() where id=l.id returning * into l;
   else raise exception 'Acción de licencia no disponible';end if;
  end if;
  insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message) values(p_actor,l.user_id,'licenses',l.id,'license.'||p_action,reason);
  return to_jsonb(l);
 end if;
 raise exception 'Módulo no disponible';
end $$;
revoke all on function public.kp_admin_action(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.kp_admin_action(uuid,text,text,jsonb) to service_role;

create function public.kp_ticket_action(p_actor uuid,p_action text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare t public.kp_tickets;is_admin boolean;note text;next_status text;assignee uuid;lic public.kp_licenses;owner uuid;
begin
 select role='admin' into is_admin from public.kp_profiles where id=p_actor and active and not must_change_password;
 if not found then raise exception 'Cuenta activa requerida';end if;
 perform set_config('karpanda.actor',p_actor::text,true);
 if p_action='create' then
  owner:=case when is_admin and nullif(p_payload->>'user_id','') is not null then (p_payload->>'user_id')::uuid else p_actor end;
  if not exists(select 1 from public.kp_profiles where id=owner and active) then raise exception 'Cliente no disponible';end if;
  if length(trim(coalesce(p_payload->>'subject','')))<3 or length(trim(coalesce(p_payload->>'message','')))<10 then raise exception 'Completa el asunto y el mensaje';end if;
  if nullif(p_payload->>'license_id','') is not null then
   select * into lic from public.kp_licenses where id=(p_payload->>'license_id')::uuid and user_id=owner;
   if not found then raise exception 'Licencia no disponible';end if;
  end if;
  insert into public.kp_tickets(user_id,subject,message,product_id,license_id) values(owner,trim(p_payload->>'subject'),trim(p_payload->>'message'),coalesce(lic.product_id,nullif(p_payload->>'product_id','')::uuid),lic.id) returning * into t;
  return to_jsonb(t);
 end if;
 select * into t from public.kp_tickets where id=(p_payload->>'id')::uuid for update;
 if not found or (not is_admin and t.user_id<>p_actor) then raise exception 'Solicitud no disponible';end if;
 if p_action='reply' then
  if t.status='closed' then raise exception 'Reabre el ticket antes de responder';end if;
  if coalesce((p_payload->>'internal')::boolean,false) and not is_admin then raise exception 'Solo un administrador puede crear notas internas';end if;
  insert into public.kp_ticket_messages(ticket_id,author_id,body,internal) values(t.id,p_actor,trim(p_payload->>'message'),coalesce((p_payload->>'internal')::boolean,false));
  update public.kp_tickets set updated_at=now() where id=t.id returning * into t;
  insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,internal) values(p_actor,t.user_id,'tickets',t.id,'ticket.reply',case when coalesce((p_payload->>'internal')::boolean,false) then 'Nota interna añadida' else 'Nueva respuesta' end,coalesce((p_payload->>'internal')::boolean,false));
 elsif p_action='update' then
  if not is_admin then raise exception 'Acceso administrativo requerido';end if;
  assignee:=nullif(p_payload->>'assigned_to','')::uuid;
  if assignee is not null and not exists(select 1 from public.kp_profiles where id=assignee and role='admin' and active and not must_change_password) then raise exception 'Responsable no disponible';end if;
  update public.kp_tickets set priority=coalesce(p_payload->>'priority',priority),assigned_to=assignee,updated_at=now() where id=t.id returning * into t;
 elsif p_action in ('progress','resolve','close','reopen') then
  if not is_admin and p_action not in ('close','reopen') then raise exception 'Acceso administrativo requerido';end if;
  if p_action='reopen' and t.status not in ('resolved','closed') then raise exception 'El ticket ya está abierto';end if;
  if p_action<>'reopen' and t.status='closed' then raise exception 'Reabre primero el ticket';end if;
  next_status:=case p_action when 'progress' then 'in_progress' when 'resolve' then 'resolved' when 'close' then 'closed' else 'open' end;
  update public.kp_tickets set status=next_status,resolved_at=case when next_status in ('resolved','closed') then now() else null end,updated_at=now() where id=t.id returning * into t;
  insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,internal) values(p_actor,t.user_id,'tickets',t.id,'ticket.status','Estado actualizado: '||next_status,false);
 else raise exception 'Acción de soporte no disponible';end if;
 return to_jsonb(t);
end $$;
revoke all on function public.kp_ticket_action(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.kp_ticket_action(uuid,text,jsonb) to service_role;
