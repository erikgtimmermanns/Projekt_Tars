create table if not exists public.kiosk_alliance_snapshots (
    alliance_tag text not null check (alliance_tag in ('MTG', 'AZB')),
    points bigint not null check (points >= 0),
    captured_at timestamptz not null,
    primary key (alliance_tag, captured_at)
);

alter table public.kiosk_alliance_snapshots enable row level security;

revoke all on table public.kiosk_alliance_snapshots from public, anon, authenticated;
grant select, insert, delete on table public.kiosk_alliance_snapshots to service_role;
