begin;
do $$
declare sid text:=repeat(md5(gen_random_uuid()::text),2);ip text:=repeat(md5(gen_random_uuid()::text),2);actor uuid;report jsonb;
begin
 if not public.kp_record_traffic(gen_random_uuid(),sid,ip,'/demo/educacion','demo_start','direct','mobile') then raise exception 'Education start rejected';end if;
 if not public.kp_record_traffic(gen_random_uuid(),sid,ip,'/demo/educacion','demo_complete','direct','mobile') then raise exception 'Education completion rejected';end if;
 if (select count(*) from kp_private.traffic_sessions where session_hash=sid)<>1 then raise exception 'Session aggregation failed';end if;
 select id into actor from public.kp_profiles where role='admin' and active and not must_change_password limit 1;
 if actor is null then raise exception 'Existing administrator required';end if;
 report:=public.kp_traffic_report(actor,7);
 if not exists(select 1 from jsonb_array_elements(report->'demos') d where d->>'path'='/demo/educacion' and (d->>'starts')::integer>0 and (d->>'completions')::integer>0) then raise exception 'Education missing from report';end if;
 if has_function_privilege('anon','public.kp_traffic_report(uuid,integer)','EXECUTE') or has_function_privilege('authenticated','public.kp_record_traffic(uuid,text,text,text,text,text,text)','EXECUTE') then raise exception 'Public RPC access exposed';end if;
end $$;
rollback;
