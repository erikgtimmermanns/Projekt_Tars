-- TradingView-Chart für COUD: globale Aktivierung und der von Tablet und
-- Kiosk gemeinsam verwendete Zeitraum der aktuell geöffneten Ansicht.
alter table public.kiosk_settings
    add column if not exists coud_chart_enabled boolean not null default false;

alter table public.kiosk_state
    add column if not exists selected_kiosk_chart_range text;

alter table public.kiosk_state
    drop constraint if exists kiosk_state_selected_kiosk_view_check;

alter table public.kiosk_state
    add constraint kiosk_state_selected_kiosk_view_check
    check (selected_kiosk_view is null or selected_kiosk_view in ('alliance-comparison', 'nasa-apod', 'coud-chart'));

alter table public.kiosk_state
    add constraint kiosk_state_selected_kiosk_chart_range_check
    check (selected_kiosk_chart_range is null or selected_kiosk_chart_range in ('1D', '1M', '3M', '12M', '60M', 'ALL'));

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
        selected_kiosk_chart_range = null,
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
    if p_view is not null and p_view not in ('alliance-comparison', 'nasa-apod', 'coud-chart') then
        raise exception 'Unsupported kiosk view';
    end if;

    update public.kiosk_state
    set selected_visitor_id = null,
        selected_visitor_at = null,
        selected_kiosk_view = p_view,
        selected_kiosk_chart_range = case when p_view = 'coud-chart' then '1D' else null end,
        -- Ältere Kiosk-Clients können die Seekampf-Ansicht weiter darstellen.
        selected_kiosk_url = case when p_view = 'alliance-comparison' then 'https://seekampf.de/statistik' else null end,
        selected_kiosk_at = case when p_view is null then null else now() end
    where id = 1;
end;
$function$;

create or replace function public.set_kiosk_chart_range(p_range text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
    if p_range not in ('1D', '1M', '3M', '12M', '60M', 'ALL') then
        raise exception 'Unsupported chart range';
    end if;

    update public.kiosk_state
    set selected_kiosk_chart_range = p_range
    where id = 1
      and selected_kiosk_view = 'coud-chart';

    if not found then
        raise exception 'COUD chart is not the active kiosk view';
    end if;
end;
$function$;

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
        selected_kiosk_chart_range = null,
        selected_kiosk_url = p_url,
        selected_kiosk_at = case when p_url is null then null else now() end
    where id = 1;
end;
$function$;

revoke all on function public.set_kiosk_chart_range(text) from public;
grant execute on function public.set_kiosk_chart_range(text) to anon, authenticated;
