begin;
do $$
declare actor uuid;
begin
 select id into actor from public.kp_profiles where role='admin' and active and not must_change_password limit 1;
 if actor is null then raise exception 'Existing active administrator required';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$
declare product uuid;result jsonb;blocked boolean:=false;
begin
 select id into product from public.kp_products where slug='educacion' and published and demo_path='/demo/educacion' and price=0;
 if product is null then raise exception 'Education is not a real quotation product';end if;
 begin perform public.kp_create_order(product,'Prueba transaccional de cotización');exception when others then if sqlerrm like '%cotización%' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'Quotation product allowed automatic checkout';end if;
 result:=public.kp_create_order((select id from public.kp_products where slug='ventas'),'Prueba transaccional de precio');
 if (result->>'amount')::numeric<>(select price from public.kp_products where slug='ventas') then raise exception 'Subscription order price changed';end if;
end $$;
reset role;
do $$
declare sid text:=repeat(md5(gen_random_uuid()::text),2);ip text:=repeat(md5(gen_random_uuid()::text),2);actor uuid;report jsonb;
begin
 if not public.kp_record_traffic(gen_random_uuid(),sid,ip,'/demo/gestion','demo_start','direct','mobile') then raise exception 'Management start rejected';end if;
 if not public.kp_record_traffic(gen_random_uuid(),sid,ip,'/demo/gestion','demo_complete','direct','mobile') then raise exception 'Management completion rejected';end if;
 select id into actor from public.kp_profiles where role='admin' and active and not must_change_password limit 1;
 report:=public.kp_traffic_report(actor,7);
 if not exists(select 1 from jsonb_array_elements(report->'demos') d where d->>'path'='/demo/gestion' and (d->>'completions')::integer>0) then raise exception 'Management missing from report';end if;
 if has_function_privilege('anon','public.kp_record_traffic(uuid,text,text,text,text,text,text)','EXECUTE') then raise exception 'Public traffic RPC access exposed';end if;
end $$;
rollback;
select 'Catalog quotation protection, subscription pricing and management traffic passed; fixtures rolled back' as result;
