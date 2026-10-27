-- Run inside a transaction against the migrated schema. Always rolled back.
begin;
insert into auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('a1111111-1111-4111-8111-111111111111','backoffice-admin@example.invalid','authenticated','authenticated','{"role":"admin"}','{"name":"Test admin"}',now(),now()),
('b1111111-1111-4111-8111-111111111111','backoffice-client@example.invalid','authenticated','authenticated','{"role":"customer"}','{"name":"Test client"}',now(),now()),
('c1111111-1111-4111-8111-111111111111','backoffice-other@example.invalid','authenticated','authenticated','{"role":"customer"}','{"name":"Other client"}',now(),now());
select set_config('request.jwt.claim.sub','b1111111-1111-4111-8111-111111111111',true);
insert into public.kp_orders(id,user_id,product_id,product_name,buyer_name,amount,status)
select 'd1111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111',id,name,'Test client',price,'pending' from public.kp_products where published order by price limit 1;
select set_config('request.jwt.claim.sub','',true);
do $$
declare actor uuid:='a1111111-1111-4111-8111-111111111111'; client uuid:='b1111111-1111-4111-8111-111111111111'; other uuid:='c1111111-1111-4111-8111-111111111111'; oid uuid:='d1111111-1111-4111-8111-111111111111'; lic uuid; ticket uuid; result jsonb;
begin
 begin perform public.kp_admin_action(client,'orders','confirm_payment',jsonb_build_object('id',oid,'reason','Test payment')); raise exception 'TEST FAIL: client mutated order'; exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise; end if; end;
 begin perform public.kp_admin_action(actor,'orders','confirm_payment',jsonb_build_object('id',oid,'reason','Test payment')); raise exception 'TEST FAIL: payment without acknowledgement'; exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise; end if; end;
 result:=public.kp_admin_action(actor,'orders','confirm_payment',jsonb_build_object('id',oid,'reason','Confirmed test external payment','reference','QA-ROLLBACK-PAY','acknowledged',true));
 perform public.kp_admin_action(actor,'orders','confirm_payment',jsonb_build_object('id',oid,'reason','Repeated request','reference','QA-ROLLBACK-PAY','acknowledged',true));
 if (select count(*) from public.kp_licenses where order_id=oid)<>1 or (select count(*) from public.kp_payments where order_id=oid)<>1 then raise exception 'TEST FAIL: duplicate payment or license';end if;
 select id into lic from public.kp_licenses where order_id=oid;
 perform public.kp_admin_action(actor,'licenses','suspend',jsonb_build_object('id',lic,'reason','Test suspension'));
 if (select status from public.kp_licenses where id=lic)<>'suspended' then raise exception 'TEST FAIL: suspension';end if;
 perform public.kp_admin_action(actor,'licenses','renew',jsonb_build_object('id',lic,'reason','Test renewal','expires_at',now()+interval '3 months'));
 perform public.kp_admin_action(actor,'orders','refund_manual',jsonb_build_object('id',oid,'reason','Confirmed external full refund','reference','QA-ROLLBACK-REFUND','acknowledged',true));
 if (select status from public.kp_licenses where id=lic)<>'revoked' then raise exception 'TEST FAIL: refunded license still active';end if;
 begin perform public.kp_admin_action(actor,'orders','cancel',jsonb_build_object('id',oid,'reason','Invalid transition'));raise exception 'TEST FAIL: refunded order cancelled';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 result:=public.kp_ticket_action(client,'create','{"subject":"Integration fixture","message":"Test conversation persisted transactionally"}'); ticket:=(result->>'id')::uuid;
 perform public.kp_ticket_action(actor,'reply',jsonb_build_object('id',ticket,'message','Private operator note','internal',true));
 perform public.kp_ticket_action(client,'reply',jsonb_build_object('id',ticket,'message','Public client reply','internal',false));
 begin perform public.kp_ticket_action(other,'reply',jsonb_build_object('id',ticket,'message','Unauthorized reply'));raise exception 'TEST FAIL: foreign ticket access';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 begin perform public.kp_ticket_action(client,'reply',jsonb_build_object('id',ticket,'message','Unauthorized internal note','internal',true));raise exception 'TEST FAIL: customer internal note';exception when raise_exception then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 perform public.kp_ticket_action(actor,'update',jsonb_build_object('id',ticket,'priority','urgent','assigned_to',actor));
 perform public.kp_ticket_action(actor,'resolve',jsonb_build_object('id',ticket));
 perform public.kp_ticket_action(client,'reopen',jsonb_build_object('id',ticket));
 perform public.kp_dashboard(actor,now()-interval '30 days',now()+interval '1 day');
end $$;
select set_config('request.jwt.claim.sub','b1111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$begin
 if (select count(*) from public.kp_ticket_messages where body='Private operator note')<>0 then raise exception 'TEST FAIL: private message exposed';end if;
 if (select count(*) from public.kp_ticket_messages where body='Public client reply')<>1 then raise exception 'TEST FAIL: own message hidden';end if;
 if (select count(*) from public.kp_profiles)<>1 then raise exception 'TEST FAIL: customer sees other profiles';end if;
 if has_function_privilege(current_user,'public.kp_admin_action(uuid,text,text,jsonb)','execute') then raise exception 'TEST FAIL: direct admin RPC allowed';end if;
 if has_column_privilege(current_user,'public.kp_licenses','notes','select') then raise exception 'TEST FAIL: administrative license notes exposed';end if;
 if has_table_privilege(current_user,'public.kp_activity','update') then raise exception 'TEST FAIL: audit mutable';end if;
end $$;
reset role;
-- A previously issued admin JWT cannot override current profile state.
update auth.users set raw_app_meta_data='{"role":"customer"}' where id='a1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$begin if kp_private.is_admin() then raise exception 'TEST FAIL: stale admin token retained privileges';end if;end $$;
reset role;
update auth.users set banned_until=now()+interval '1 day' where id='b1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','b1111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$begin if kp_private.account_ready() or (select count(*) from public.kp_orders)>0 then raise exception 'TEST FAIL: inactive account retains access';end if;end $$;
reset role;
rollback;
select 'All business and RLS assertions passed; fixtures rolled back' as result;
