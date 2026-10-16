alter table public.kiosk_state
    add column if not exists selected_kiosk_url text,
    add column if not exists selected_kiosk_at timestamptz;

create or replace function public.set_kiosk_visitor_selection(p_visitor_id text)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $function$
    update public.kiosk_state
    set selected_visitor_id = p_visitor_id,
        selected_visitor_at = case when p_visitor_id is null then null else now() end,
        selected_kiosk_url = null,
        selected_kiosk_at = null
    where id = 1;
$function$;

revoke all on function public.set_kiosk_visitor_selection(text) from public;
grant execute on function public.set_kiosk_visitor_selection(text) to anon;

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
        selected_kiosk_url = p_url,
        selected_kiosk_at = case when p_url is null then null else now() end
    where id = 1;
end;
$function$;

revoke all on function public.set_kiosk_url_selection(text) from public;
grant execute on function public.set_kiosk_url_selection(text) to anon, authenticated;