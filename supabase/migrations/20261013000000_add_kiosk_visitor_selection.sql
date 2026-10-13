alter table public.kiosk_state
    add column if not exists selected_visitor_id text,
    add column if not exists selected_visitor_at timestamptz;

alter table public.kiosk_state enable row level security;
grant select on public.kiosk_state to anon;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
            and tablename = 'kiosk_state'
            and policyname = 'kiosk_selection_read_anon'
    ) then
        create policy kiosk_selection_read_anon
            on public.kiosk_state
            for select
            to anon, authenticated
            using (id = 1);
    end if;
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
            and tablename = 'kiosk_state'
            and policyname = 'kiosk_selection_row_limit'
    ) then
        create policy kiosk_selection_row_limit
            on public.kiosk_state
            as restrictive
            for select
            to anon
            using (id = 1);
    end if;
end;
$$;

create or replace function public.set_kiosk_visitor_selection(p_visitor_id text)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $function$
    update public.kiosk_state
    set selected_visitor_id = p_visitor_id,
        selected_visitor_at = case when p_visitor_id is null then null else now() end
    where id = 1;
$function$;

revoke all on function public.set_kiosk_visitor_selection(text) from public;
grant execute on function public.set_kiosk_visitor_selection(text) to anon;

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
        and not exists (
            select 1
            from pg_publication_tables
            where pubname = 'supabase_realtime'
                and schemaname = 'public'
                and tablename = 'kiosk_state'
        ) then
        alter publication supabase_realtime add table public.kiosk_state;
    end if;
end;
$$;