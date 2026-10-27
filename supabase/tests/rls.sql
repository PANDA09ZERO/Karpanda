-- Transactional integration checks: all fixtures are rolled back.
begin;
insert into auth.users(id,aud,role,email) values
('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1','authenticated','authenticated','karpanda-rls-1@example.invalid'),
('aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2','authenticated','authenticated','karpanda-rls-2@example.invalid');
set local role anon;
do $$ begin
  if (select count(*) from public.kp_products where published) < 3 then raise exception 'Public catalog unavailable'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1","role":"authenticated","app_metadata":{},"user_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$ declare r jsonb; affected int; begin
  r:=public.kp_create_order('11111111-1111-4111-8111-111111111111','RLS Test Buyer');
  if (r->>'amount')::numeric <> 199 or r->>'status'<>'pending' then raise exception 'Invalid server price/status'; end if;
  if (select count(*) from public.kp_orders)<>1 then raise exception 'Owner visibility failed'; end if;
  if (select count(*) from public.kp_licenses)<>0 then raise exception 'Pending order issued license'; end if;
  begin
    insert into public.kp_orders(user_id,product_id,buyer_name,amount,status) values('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1','11111111-1111-4111-8111-111111111111','Spoofed buyer',1,'paid');
    raise exception 'Client spoofed payment';
  exception when insufficient_privilege then null; end;
  begin
    update public.kp_orders set status='paid'; raise exception 'Client confirmed payment';
  exception when insufficient_privilege then null; end;
  update public.kp_products set price=1 where slug='ventas'; get diagnostics affected = row_count;
  if affected<>0 then raise exception 'User metadata escalated to admin'; end if;
  insert into public.kp_tickets(user_id,subject,message) values('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1','RLS test','Test support ticket content');
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2","role":"authenticated","app_metadata":{}}',true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.kp_orders)<>0 then raise exception 'Other owner reads orders'; end if;
  if (select count(*) from public.kp_tickets)<>0 then raise exception 'Other owner reads tickets'; end if;
end $$;
reset role;
rollback;
select 'PASS: public catalog, server price, pending orders, no client payment confirmation, owner isolation, user_metadata cannot elevate privileges' as result;
