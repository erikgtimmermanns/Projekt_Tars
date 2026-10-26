-- Globale Kiosk-Widgets. Die alte Einstellung seekampf_pinned wird einmalig
-- übernommen und bleibt vorerst für ältere Clients erhalten.
alter table public.kiosk_settings
    add column if not exists seekampf_enabled boolean not null default false,
    add column if not exists nasa_apod_enabled boolean not null default false,
    add column if not exists widget_rotate_interval_seconds integer not null default 15
        check (widget_rotate_interval_seconds between 5 and 120);

update public.kiosk_settings
set seekampf_enabled = true
where seekampf_pinned = true
  and seekampf_enabled = false;
