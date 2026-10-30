-- Globale, vom Besucherprofil getrennte Vorlage für das Tablet-Besucher-Overlay.
create table if not exists public.visitor_overlay_configs (
    kiosk_settings_id integer primary key references public.kiosk_settings(id) on delete cascade,
    layout jsonb not null default '{"version":1,"blocks":[]}'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null,
    constraint visitor_overlay_configs_layout_is_object check (jsonb_typeof(layout) = 'object')
);

insert into public.visitor_overlay_configs (kiosk_settings_id, layout)
values (1, '{
  "version": 1,
  "blocks": [
    {"id":"visitor-logo","type":"visitor-logo","x":1,"y":1,"width":4,"height":3},
    {"id":"welcome-title","type":"text","text":"Herzlich willkommen,","x":5,"y":1,"width":7,"height":1,"fontSize":"large"},
    {"id":"visitor-name","type":"visitor-name","x":5,"y":2,"width":7,"height":2,"fontSize":"hero"},
    {"id":"welcome-video","type":"video","src":"https://www.youtube.com/embed/wSGoUSwNb44?autoplay=1&mute=1&playsinline=1&controls=1&rel=0","x":1,"y":5,"width":11,"height":7}
  ]
}'::jsonb)
on conflict (kiosk_settings_id) do nothing;

alter table public.visitor_overlay_configs enable row level security;

grant select on public.visitor_overlay_configs to anon, authenticated;
grant insert, update on public.visitor_overlay_configs to authenticated;

drop policy if exists visitor_overlay_configs_read on public.visitor_overlay_configs;
create policy visitor_overlay_configs_read
    on public.visitor_overlay_configs
    for select to anon, authenticated
    using (kiosk_settings_id = 1);

drop policy if exists visitor_overlay_configs_write on public.visitor_overlay_configs;
create policy visitor_overlay_configs_write
    on public.visitor_overlay_configs
    for all to authenticated
    using (kiosk_settings_id = 1)
    with check (kiosk_settings_id = 1);

-- Einheitlicher Zeitstempel auch bei Updates über das Admin-UI.
create or replace function public.touch_visitor_overlay_config()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
    new.updated_at = now();
    new.updated_by = auth.uid();
    return new;
end;
$function$;

drop trigger if exists visitor_overlay_configs_touch on public.visitor_overlay_configs;
create trigger visitor_overlay_configs_touch
before update on public.visitor_overlay_configs
for each row execute function public.touch_visitor_overlay_config();

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'visitor_overlay_configs'
       ) then
        alter publication supabase_realtime add table public.visitor_overlay_configs;
    end if;
end;
$$;
