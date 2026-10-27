-- Cache JWT lookups and avoid overlapping permissive SELECT policies.
alter policy "Read published products" on public.kp_products to anon;
alter policy "Read licensed products" on public.kp_products using (
 published or ((select auth.jwt())->'app_metadata'->>'role')='admin' or exists (
 select 1 from public.kp_licenses l where l.product_id=kp_products.id and l.user_id=(select auth.uid())));
drop policy "Administrators manage products" on public.kp_products;
drop policy "Administrators manage releases" on public.kp_releases;
create policy "Administrators insert products" on public.kp_products for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Administrators update products" on public.kp_products for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Administrators delete products" on public.kp_products for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') ;
create policy "Administrators insert releases" on public.kp_releases for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Administrators update releases" on public.kp_releases for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Administrators delete releases" on public.kp_releases for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') ;
alter policy "Owners or administrators read orders" on public.kp_orders using ((select auth.uid())=user_id or ((select auth.jwt())->'app_metadata'->>'role')='admin');
alter policy "Owners or administrators read licenses" on public.kp_licenses using ((select auth.uid())=user_id or ((select auth.jwt())->'app_metadata'->>'role')='admin');
alter policy "Owners or administrators read tickets" on public.kp_tickets using ((select auth.uid())=user_id or ((select auth.jwt())->'app_metadata'->>'role')='admin');
alter policy "Licensed users read releases" on public.kp_releases using (((select auth.jwt())->'app_metadata'->>'role')='admin' or exists (select 1 from public.kp_licenses l where l.product_id=kp_releases.product_id and l.user_id=(select auth.uid()) and l.status='active' and (l.expires_at is null or l.expires_at>now())));
alter policy "Administrators resolve tickets" on public.kp_tickets using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
