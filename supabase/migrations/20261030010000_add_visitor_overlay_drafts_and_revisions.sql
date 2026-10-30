-- Entwurf und veröffentlichte Version bleiben getrennt: Nur `layout` wird vom
-- Kiosk gelesen, `draft_layout` ist der Arbeitsstand im Admin-Baukasten.
alter table public.visitor_overlay_configs
    add column if not exists draft_layout jsonb;

update public.visitor_overlay_configs
set draft_layout = layout
where draft_layout is null;

alter table public.visitor_overlay_configs
    alter column draft_layout set not null;

create table if not exists public.visitor_overlay_revisions (
    id bigint generated always as identity primary key,
    kiosk_settings_id integer not null references public.kiosk_settings(id) on delete cascade,
    layout jsonb not null,
    label text not null default 'Veröffentlichte Version',
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    constraint visitor_overlay_revisions_layout_is_object check (jsonb_typeof(layout) = 'object'),
    constraint visitor_overlay_revisions_kiosk_limit check (kiosk_settings_id = 1)
);

alter table public.visitor_overlay_revisions enable row level security;
grant select, insert on public.visitor_overlay_revisions to authenticated;

drop policy if exists visitor_overlay_revisions_read on public.visitor_overlay_revisions;
create policy visitor_overlay_revisions_read
    on public.visitor_overlay_revisions
    for select to authenticated
    using (kiosk_settings_id = 1);

drop policy if exists visitor_overlay_revisions_write on public.visitor_overlay_revisions;
create policy visitor_overlay_revisions_write
    on public.visitor_overlay_revisions
    for insert to authenticated
    with check (kiosk_settings_id = 1 and created_by = auth.uid());

-- Veröffentlichen passiert atomar: Revision anlegen und erst dann die vom
-- Kiosk abonnierte Vorlage ersetzen.
create or replace function public.publish_visitor_overlay(p_layout jsonb, p_label text default null)
returns public.visitor_overlay_configs
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
    next_config public.visitor_overlay_configs;
begin
    if jsonb_typeof(p_layout) <> 'object' then
        raise exception 'Overlay layout must be a JSON object';
    end if;

    update public.visitor_overlay_configs
       set layout = p_layout,
           draft_layout = p_layout,
           updated_at = now(),
           updated_by = auth.uid()
     where kiosk_settings_id = 1
     returning * into next_config;

    if not found then
        insert into public.visitor_overlay_configs (kiosk_settings_id, layout, draft_layout, updated_by)
        values (1, p_layout, p_layout, auth.uid())
        returning * into next_config;
    end if;

    insert into public.visitor_overlay_revisions (kiosk_settings_id, layout, label, created_by)
    values (1, p_layout, coalesce(nullif(trim(p_label), ''), 'Veröffentlichte Version'), auth.uid());

    return next_config;
end;
$function$;

revoke all on function public.publish_visitor_overlay(jsonb, text) from public;
grant execute on function public.publish_visitor_overlay(jsonb, text) to authenticated;
