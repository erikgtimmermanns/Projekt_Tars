alter table public.kiosk_settings
    add column if not exists seekampf_pinned boolean not null default false;
