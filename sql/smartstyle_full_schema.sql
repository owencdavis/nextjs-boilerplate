
-- SmartStyle (Supabase/Postgres) — initial schema migration
-- Run in the SQL Editor or via `supabase db push`.

-- =====================================
-- Extensions
-- =====================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =====================================
-- Enums
-- =====================================
do $$ begin
    if not exists (select 1 from pg_type where typname = 'coloring_palette') then
        create type coloring_palette as enum ('spring','summer','autumn','winter','neutral','unknown');
    end if;
    if not exists (select 1 from pg_type where typname = 'skin_undertone') then
        create type skin_undertone   as enum ('cool','warm','neutral','unknown');
    end if;
    if not exists (select 1 from pg_type where typname = 'target_gender') then
        create type target_gender  as enum ('womens','mens','unisex','kids','unknown');
    end if;
    if not exists (select 1 from pg_type where typname = 'item_status') then
        create type item_status    as enum ('owned','wishlist','donated','returned','tailor','archived');
    end if;
    if not exists (select 1 from pg_type where typname = 'size_system') then
        create type size_system as enum ('us','uk','eu','jp','alpha','custom');
    end if;
    if not exists (select 1 from pg_type where typname = 'media_kind') then
        create type media_kind as enum ('image','video','url');
    end if;
end $$;

-- =====================================
-- Utility function: auto-update `updated_at`
-- =====================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================
-- Persona domain
-- =====================================
create table if not exists public.personas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  display_name     text not null,
  birth_date       date,
  coloring         coloring_palette not null default 'unknown',
  undertone        skin_undertone not null default 'unknown',
  eye_color        text,
  hair_color       text,
  skin_tone        text,
  body_shape       text,
  style_keywords   text[] not null default '{}',
  brand_prefs      text[] not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.persona_measurements (
  id               uuid primary key default gen_random_uuid(),
  persona_id       uuid not null references public.personas(id) on delete cascade,
  name             text not null,
  value_cm         numeric(6,2) not null,
  taken_on         date default now(),
  notes            text,
  unique (persona_id, name)
);

create table if not exists public.persona_preferences (
  id               uuid primary key default gen_random_uuid(),
  persona_id       uuid not null references public.personas(id) on delete cascade,
  pref_key         text not null,
  pref_value       jsonb not null,
  priority         int default 0,
  unique (persona_id, pref_key)
);

-- =====================================
-- Vendor domain
-- =====================================
create table if not exists public.vendors (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  website_url      text,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  wholesale        boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (name)
);

-- =====================================
-- Product & Variants
-- =====================================
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors(id) on delete restrict,
  name             text not null,
  description      text,
  category         text,
  subcategory      text,
  target_gender    target_gender not null default 'unknown',
  material         text,
  care             text,
  base_color       text,
  msrp             numeric(12,2),
  currency         text default 'USD',
  external_handle  text,
  search_tags      text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  sku              text,
  barcode          text,
  size_system      size_system default 'custom',
  size_label       text,
  numeric_size     numeric(6,2),
  color            text,
  length_label     text,
  rise_label       text,
  fit_notes        text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.inventory (
  id               uuid primary key default gen_random_uuid(),
  variant_id       uuid not null references public.product_variants(id) on delete cascade,
  vendor_id        uuid references public.vendors(id) on delete set null,
  quantity_on_hand int not null default 0,
  cost             numeric(12,2),
  price            numeric(12,2),
  currency         text default 'USD',
  location         text,
  last_synced_at   timestamptz,
  unique (variant_id, location)
);

create table if not exists public.media_assets (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid references public.products(id) on delete cascade,
  variant_id       uuid references public.product_variants(id) on delete cascade,
  kind             media_kind not null default 'image',
  url              text not null,
  alt              text,
  is_primary       boolean not null default false,
  position         int default 0,
  constraint media_assets_target_chk check (
    (product_id is not null) or (variant_id is not null)
  )
);

-- =====================================
-- Wardrobe domain
-- =====================================
create table if not exists public.wardrobes (
  id               uuid primary key default gen_random_uuid(),
  persona_id       uuid not null references public.personas(id) on delete cascade,
  title            text not null,
  is_active        boolean not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.wardrobe_items (
  id               uuid primary key default gen_random_uuid(),
  wardrobe_id      uuid not null references public.wardrobes(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  variant_id       uuid references public.product_variants(id) on delete set null,
  status           item_status not null default 'owned',
  acquired_on      date,
  purchase_price   numeric(12,2),
  currency         text default 'USD',
  condition        text,
  fit_rating       int check (fit_rating between 1 and 5),
  tailor_notes     text,
  style_tags       text[] not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint wardrobe_items_link_chk check (
    product_id is not null or variant_id is not null
  )
);

create table if not exists public.outfits (
  id               uuid primary key default gen_random_uuid(),
  persona_id       uuid not null references public.personas(id) on delete cascade,
  title            text not null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.outfit_items (
  id               uuid primary key default gen_random_uuid(),
  outfit_id        uuid not null references public.outfits(id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  role             text,
  position         int default 0,
  unique (outfit_id, wardrobe_item_id)
);

-- =====================================
-- Indexes
-- =====================================
create index if not exists idx_persona_measurements_persona on public.persona_measurements (persona_id);
create index if not exists idx_persona_prefs_persona on public.persona_preferences (persona_id);
create index if not exists idx_products_vendor on public.products (vendor_id);
create index if not exists idx_variants_product on public.product_variants (product_id);
create index if not exists idx_inventory_variant on public.inventory (variant_id);
create index if not exists idx_media_assets_product_variant on public.media_assets (product_id, variant_id);
create index if not exists idx_wardrobes_persona on public.wardrobes (persona_id);
create index if not exists idx_wardrobe_items_wardrobe on public.wardrobe_items (wardrobe_id);
create index if not exists idx_wardrobe_items_variant_product on public.wardrobe_items (variant_id, product_id);

-- Full-text-ish helpers
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_tags_gin_idx  on public.products using gin (search_tags);

-- =====================================
-- Triggers: updated_at
-- =====================================
drop trigger if exists trig_personas_updated on public.personas;
create trigger trig_personas_updated
before update on public.personas
for each row execute function public.set_updated_at();

drop trigger if exists trig_persona_measurements_updated on public.persona_measurements;
create trigger trig_persona_measurements_updated
before update on public.persona_measurements
for each row execute function public.set_updated_at();

drop trigger if exists trig_persona_preferences_updated on public.persona_preferences;
create trigger trig_persona_preferences_updated
before update on public.persona_preferences
for each row execute function public.set_updated_at();

drop trigger if exists trig_vendors_updated on public.vendors;
create trigger trig_vendors_updated
before update on public.vendors
for each row execute function public.set_updated_at();

drop trigger if exists trig_products_updated on public.products;
create trigger trig_products_updated
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trig_product_variants_updated on public.product_variants;
create trigger trig_product_variants_updated
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists trig_inventory_updated on public.inventory;
create trigger trig_inventory_updated
before update on public.inventory
for each row execute function public.set_updated_at();

drop trigger if exists trig_media_assets_updated on public.media_assets;
create trigger trig_media_assets_updated
before update on public.media_assets
for each row execute function public.set_updated_at();

drop trigger if exists trig_wardrobes_updated on public.wardrobes;
create trigger trig_wardrobes_updated
before update on public.wardrobes
for each row execute function public.set_updated_at();

drop trigger if exists trig_wardrobe_items_updated on public.wardrobe_items;
create trigger trig_wardrobe_items_updated
before update on public.wardrobe_items
for each row execute function public.set_updated_at();

drop trigger if exists trig_outfits_updated on public.outfits;
create trigger trig_outfits_updated
before update on public.outfits
for each row execute function public.set_updated_at();

drop trigger if exists trig_outfit_items_updated on public.outfit_items;
create trigger trig_outfit_items_updated
before update on public.outfit_items
for each row execute function public.set_updated_at();

-- =====================================
-- Row Level Security (RLS)
-- =====================================
-- Personas visible only to their owner
alter table public.personas enable row level security;

drop policy if exists persona_owner_read on public.personas;
create policy persona_owner_read
on public.personas for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists persona_owner_write on public.personas;
create policy persona_owner_write
on public.personas for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Wardrobes linked to persona owner
alter table public.wardrobes enable row level security;
drop policy if exists wardrobe_by_persona_owner on public.wardrobes;
create policy wardrobe_by_persona_owner
on public.wardrobes for all
to authenticated
using (
  exists (
    select 1 from public.personas p
    where p.id = wardrobes.persona_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.personas p
    where p.id = wardrobes.persona_id and p.user_id = auth.uid()
  )
);

-- Wardrobe items follow wardrobe ownership
alter table public.wardrobe_items enable row level security;
drop policy if exists wardrobe_items_by_persona_owner on public.wardrobe_items;
create policy wardrobe_items_by_persona_owner
on public.wardrobe_items for all
to authenticated
using (
  exists (
    select 1
    from public.wardrobes w
    join public.personas p on p.id = w.persona_id
    where w.id = wardrobe_items.wardrobe_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.wardrobes w
    join public.personas p on p.id = w.persona_id
    where w.id = wardrobe_items.wardrobe_id
      and p.user_id = auth.uid()
  )
);

-- Outfits follow persona ownership
alter table public.outfits enable row level security;
drop policy if exists outfits_by_persona_owner on public.outfits;
create policy outfits_by_persona_owner
on public.outfits for all
to authenticated
using (
  exists (
    select 1
    from public.personas p
    where p.id = outfits.persona_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.personas p
    where p.id = outfits.persona_id
      and p.user_id = auth.uid()
  )
);

-- Outfit items follow outfit -> wardrobe -> persona
alter table public.outfit_items enable row level security;
drop policy if exists outfit_items_owner on public.outfit_items;
create policy outfit_items_owner
on public.outfit_items for all
to authenticated
using (
  exists (
    select 1
    from public.outfits o
    join public.wardrobe_items wi on wi.id = outfit_items.wardrobe_item_id
    join public.wardrobes w on w.id = wi.wardrobe_id
    join public.personas p on p.id = w.persona_id
    where o.id = outfit_items.outfit_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.outfits o
    join public.wardrobe_items wi on wi.id = outfit_items.wardrobe_item_id
    join public.wardrobes w on w.id = wi.wardrobe_id
    join public.personas p on p.id = w.persona_id
    where o.id = outfit_items.outfit_id
      and p.user_id = auth.uid()
  )
);

-- Public read for reference data: vendors, products, variants, media, inventory
alter table public.vendors enable row level security;
drop policy if exists vendors_public_read on public.vendors;
create policy vendors_public_read on public.vendors for select using (true);

alter table public.products enable row level security;
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (true);

alter table public.product_variants enable row level security;
drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants for select using (true);

alter table public.media_assets enable row level security;
drop policy if exists media_public_read on public.media_assets;
create policy media_public_read on public.media_assets for select using (true);

alter table public.inventory enable row level security;
drop policy if exists inventory_public_read on public.inventory;
create policy inventory_public_read on public.inventory for select using (true);

-- =====================================
-- Views
-- =====================================
create or replace view public.persona_measurements_in as
select
  pm.*,
  round((pm.value_cm / 2.54)::numeric, 2) as value_in
from public.persona_measurements pm;

-- Vendors
alter table public.vendors enable row level security;

create policy vendors_select_authenticated
  on public.vendors for select
  using ( auth.role() = 'authenticated' );

create policy vendors_insert_authenticated
  on public.vendors for insert
  with check ( auth.role() = 'authenticated' );

create policy vendors_update_authenticated
  on public.vendors for update
  using ( auth.role() = 'authenticated' )
  with check ( auth.role() = 'authenticated' );

create policy vendors_delete_authenticated
  on public.vendors for delete
  using ( auth.role() = 'authenticated' );

create policy products_insert_all on public.products for insert to authenticated with check (true);
create policy products_update_all on public.products for update to authenticated using (true) with check (true);
create policy products_delete_all on public.products for delete to authenticated using (true);
-- End of migration.
