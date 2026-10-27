-- Die Tablet-Auswahl beschreibt eine Kiosk-Ansicht, keine externe URL. Die
-- URL-Spalte bleibt als Kompatibilitätsfeld für bereits ausgelieferte Clients.
alter table public.kiosk_state
    add column if not exists selected_kiosk_view text;

alter table public.kiosk_state
    add constraint kiosk_state_selected_kiosk_view_check
    check (selected_kiosk_view is null or selected_kiosk_view in ('alliance-comparison', 'nasa-apod'));

update public.kiosk_state
set selected_kiosk_view = 'alliance-comparison'
where selected_kiosk_view is null
  and selected_kiosk_url = 'https://seekampf.de/statistik';

create or replace function public.set_kiosk_visitor_selection(p_visitor_id text)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $function$
    update public.kiosk_state
    set selected_visitor_id = p_visitor_id,
        selected_visitor_at = case when p_visitor_id is null then null else now() end,
        selected_kiosk_view = null,
        selected_kiosk_url = null,
        selected_kiosk_at = null
    where id = 1;
$function$;

create or replace function public.set_kiosk_view_selection(p_view text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
    if p_view is not null and p_view not in ('alliance-comparison', 'nasa-apod') then
        raise exception 'Unsupported kiosk view';
    end if;

    update public.kiosk_state
    set selected_visitor_id = null,
        selected_visitor_at = null,
        selected_kiosk_view = p_view,
        -- Ältere Kiosk-Clients können die Seekampf-Ansicht weiter darstellen.
        selected_kiosk_url = case when p_view = 'alliance-comparison' then 'https://seekampf.de/statistik' else null end,
        selected_kiosk_at = case when p_view is null then null else now() end
    where id = 1;
end;
$function$;

-- Auch ein noch offener älterer Client darf den neuen Status nicht inkonsistent
-- hinterlassen.
create or replace function public.set_kiosk_url_selection(p_url text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
    if p_url is not null and p_url <> 'https://seekampf.de/statistik' then
        raise exception 'Unsupported kiosk URL';
    end if;

    update public.kiosk_state
    set selected_visitor_id = null,
        selected_visitor_at = null,
        selected_kiosk_view = case when p_url is null then null else 'alliance-comparison' end,
        selected_kiosk_url = p_url,
        selected_kiosk_at = case when p_url is null then null else now() end
    where id = 1;
end;
$function$;

revoke all on function public.set_kiosk_view_selection(text) from public;
grant execute on function public.set_kiosk_view_selection(text) to anon, authenticated;
