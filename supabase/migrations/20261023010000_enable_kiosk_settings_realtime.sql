do $migration$
begin
    if exists (
        select 1
        from pg_publication
        where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kiosk_settings'
    ) then
        alter publication supabase_realtime add table public.kiosk_settings;
    end if;
end;
$migration$;
