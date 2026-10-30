-- Besucher-IDs werden im Kioskzustand bereits als Text transportiert. Die
-- Zuordnung verwendet denselben kanonischen Wert und bleibt damit unabhängig
-- davon, ob das bestehende visitor_profiles.id UUID oder Integer ist.
create table if not exists public.visitor_overlay_assignments (
    visitor_id text primary key,
    draft_layout jsonb not null,
    published_layout jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null,
    constraint visitor_overlay_assignments_draft_is_object check (jsonb_typeof(draft_layout) = 'object'),
    constraint visitor_overlay_assignments_published_is_object check (published_layout is null or jsonb_typeof(published_layout) = 'object')
);

alter table public.visitor_overlay_assignments enable row level security;
grant select on public.visitor_overlay_assignments to anon, authenticated;
grant insert, update, delete on public.visitor_overlay_assignments to authenticated;

drop policy if exists visitor_overlay_assignments_read on public.visitor_overlay_assignments;
create policy visitor_overlay_assignments_read
    on public.visitor_overlay_assignments
    for select to anon, authenticated
    using (true);

drop policy if exists visitor_overlay_assignments_write on public.visitor_overlay_assignments;
create policy visitor_overlay_assignments_write
    on public.visitor_overlay_assignments
    for all to authenticated
    using (true)
    with check (true);

alter table public.visitor_overlay_revisions
    add column if not exists visitor_id text;

create or replace function public.publish_visitor_specific_overlay(
    p_visitor_id text,
    p_layout jsonb,
    p_label text default null
)
returns public.visitor_overlay_assignments
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
    next_assignment public.visitor_overlay_assignments;
begin
    if nullif(trim(p_visitor_id), '') is null then
        raise exception 'Visitor ID is required';
    end if;
    if jsonb_typeof(p_layout) <> 'object' then
        raise exception 'Overlay layout must be a JSON object';
    end if;

    insert into public.visitor_overlay_assignments (visitor_id, draft_layout, published_layout, updated_at, updated_by)
    values (p_visitor_id, p_layout, p_layout, now(), auth.uid())
    on conflict (visitor_id) do update
        set draft_layout = excluded.draft_layout,
            published_layout = excluded.published_layout,
            updated_at = excluded.updated_at,
            updated_by = excluded.updated_by
    returning * into next_assignment;

    insert into public.visitor_overlay_revisions (kiosk_settings_id, visitor_id, layout, label, created_by)
    values (1, p_visitor_id, p_layout, coalesce(nullif(trim(p_label), ''), 'Besucher-Overlay veröffentlicht'), auth.uid());

    return next_assignment;
end;
$function$;

revoke all on function public.publish_visitor_specific_overlay(text, jsonb, text) from public;
grant execute on function public.publish_visitor_specific_overlay(text, jsonb, text) to authenticated;

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'visitor_overlay_assignments'
       ) then
        alter publication supabase_realtime add table public.visitor_overlay_assignments;
    end if;
end;
$$;
