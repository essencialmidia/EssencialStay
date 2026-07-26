drop policy if exists "organization_logos_insert_authenticated" on storage.objects;
drop policy if exists "organization_logos_update_authenticated" on storage.objects;

create policy "organization_logos_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "organization_logos_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "organization_logos_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- O bucket continua publico somente para leitura dos logotipos.
-- Escritas ficam restritas a pasta do proprio usuario autenticado.
