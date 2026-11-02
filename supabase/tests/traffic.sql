-- Does not create accounts or retain test visits. Run on the migrated schema.
begin;
do $$
declare before_views bigint;accepted boolean;report jsonb;actor uuid;successes integer:=0;
begin
 select coalesce(sum(views),0) into before_views from kp_private.traffic_totals;
 accepted:=public.kp_record_traffic('f1234567-1234-4123-8123-123456789abc',repeat('a',64),repeat('b',64),'/demo/ventas','page_view','direct','mobile');
 if not accepted then raise exception 'TEST FAIL: event rejected';end if;
 accepted:=public.kp_record_traffic('f1234567-1234-4123-8123-123456789abc',repeat('a',64),repeat('b',64),'/demo/ventas','page_view','direct','mobile');
 if accepted or (select sum(views) from kp_private.traffic_totals)<>before_views+1 then raise exception 'TEST FAIL: duplicate event';end if;
 perform public.kp_record_traffic(gen_random_uuid(),repeat('a',64),repeat('b',64),'/demo/ventas','demo_start','direct','mobile');
 perform public.kp_record_traffic(gen_random_uuid(),repeat('a',64),repeat('b',64),'/demo/ventas','demo_complete','direct','mobile');
 if (select count(*) from kp_private.traffic_sessions where session_hash=repeat('a',64))<>1 then raise exception 'TEST FAIL: session counted twice';end if;
 select id into actor from public.kp_profiles where role='admin' and active and not must_change_password limit 1;
 if actor is not null then
  report:=public.kp_traffic_report(actor,7);
  if (report->'metrics'->>'views')::bigint<1 or (report->'metrics'->>'starts')::bigint<1 or (report->'metrics'->>'completions')::bigint<1 then raise exception 'TEST FAIL: report totals';end if;
 end if;
 begin perform public.kp_record_traffic(gen_random_uuid(),repeat('a',64),repeat('b',64),'/admin/usuarios','page_view','direct','mobile');raise exception 'TEST FAIL: private route accepted';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 begin perform public.kp_record_traffic(gen_random_uuid(),repeat('a',64),repeat('b',64),'/','demo_complete','direct','mobile');raise exception 'TEST FAIL: demo event on homepage';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 begin perform public.kp_traffic_report('f0000000-0000-4000-8000-000000000000',7);raise exception 'TEST FAIL: unauthorized report';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 for i in 1..125 loop if public.kp_record_traffic(gen_random_uuid(),repeat('c',64),repeat('d',64),'/','page_view','direct','desktop') then successes:=successes+1;end if;end loop;
 if successes<>120 then raise exception 'TEST FAIL: rate limit';end if;
 if has_function_privilege('authenticated','public.kp_record_traffic(uuid,text,text,text,text,text,text)','execute') or has_function_privilege('anon','public.kp_traffic_report(uuid,integer)','execute') or has_table_privilege('authenticated','kp_private.traffic_sessions','select') then raise exception 'TEST FAIL: exposed measurement data';end if;
end $$;
rollback;
select 'Traffic: idempotency, session counts, report totals, private-route rejection, authorization and rate limit passed; all fixtures rolled back' as result;
