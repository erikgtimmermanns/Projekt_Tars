alter table public.kiosk_settings
    add column if not exists header_language text not null default 'de'
    check (header_language in ('de', 'en'));
