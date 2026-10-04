-- Run once in the Supabase SQL editor if product-image uploads are required.
-- Database tables are managed by Prisma migrations, not by this file.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

update storage.buckets
set file_size_limit = 307200,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'product-images';

create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins manage product images"
on storage.objects for all to authenticated
using (bucket_id = 'product-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (bucket_id = 'product-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
