-- Run this in Supabase SQL Editor to create the table and storage bucket

-- Table for assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_id text not null unique,
  name text not null,
  date date not null,
  price numeric not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

-- Allow public read/write for demo (tighten RLS in production if needed)
alter table public.assets enable row level security;

drop policy if exists "Allow all for assets" on public.assets;
create policy "Allow all for assets"
  on public.assets for all
  using (true)
  with check (true);

-- Storage bucket for asset images (create in Dashboard: Storage > New bucket > "assets" > Public)
-- Then in Storage > assets > Policies: add policy "Allow public upload and read"
