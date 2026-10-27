-- Append-only audit. No passwords, tokens or auth.users rows are serialized here.
create function kp_private.audit_business() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid; owner uuid; eid uuid; entity text; before_data jsonb; after_data jsonb; value jsonb;
begin
 actor:=coalesce(auth.uid(),nullif(current_setting('karpanda.actor',true),'')::uuid);
 before_data:=case when tg_op<>'INSERT' then to_jsonb(old) else null end;
 after_data:=case when tg_op<>'DELETE' then to_jsonb(new) else null end;
 value:=coalesce(after_data,before_data);eid:=(value->>'id')::uuid;owner:=nullif(value->>'user_id','')::uuid;
 entity:=case tg_table_name when 'kp_products' then 'products' when 'kp_orders' then 'orders' when 'kp_licenses' then 'licenses' when 'kp_tickets' then 'tickets' else 'orders' end;
 if tg_table_name in ('kp_payments','kp_refunds') then eid:=(value->>'order_id')::uuid;select user_id into owner from public.kp_orders where id=eid;end if;
 insert into public.kp_activity(actor_id,owner_id,entity,entity_id,action,message,changes)
 values(actor,owner,entity,eid,lower(tg_table_name||'.'||tg_op),'Cambio registrado en '||entity,jsonb_build_object('before',before_data,'after',after_data));
 if tg_op='DELETE' then return old;end if;return new;
end $$;
revoke all on function kp_private.audit_business() from public;
create trigger kp_audit_products after insert or update or delete on public.kp_products for each row execute function kp_private.audit_business();
create trigger kp_audit_orders after insert or update on public.kp_orders for each row execute function kp_private.audit_business();
create trigger kp_audit_licenses after insert or update on public.kp_licenses for each row execute function kp_private.audit_business();
create trigger kp_audit_tickets after insert or update on public.kp_tickets for each row execute function kp_private.audit_business();
create trigger kp_audit_payments after insert on public.kp_payments for each row execute function kp_private.audit_business();
create trigger kp_audit_refunds after insert on public.kp_refunds for each row execute function kp_private.audit_business();
