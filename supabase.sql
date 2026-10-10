-- RHAN HUB — jalankan di Supabase Dashboard > SQL Editor.
-- Kebijakan: publik dapat membaca script approved dan mengirim pending.
-- Hanya pengguna yang terdaftar pada tabel admin_users dapat memoderasi.
-- Jangan pernah menggunakan service_role key di frontend.

create extension if not exists pgcrypto;

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  game_name text not null check (char_length(trim(game_name)) between 2 and 80),
  script_name text not null check (char_length(trim(script_name)) between 2 and 100),
  category text not null check (category in ('Utility','UI / Interface','Gameplay','Modding','Other')),
  description text not null check (char_length(trim(description)) between 10 and 500),
  code text not null check (char_length(code) between 3 and 20000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.scripts enable row level security;
alter table public.admin_users enable row level security;

-- Semua orang hanya dapat membaca script yang telah disetujui.
drop policy if exists "Public can read approved scripts" on public.scripts;
create policy "Public can read approved scripts"
on public.scripts for select
to anon, authenticated
using (status = 'approved' or exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

-- Pengunjung boleh mengirim script baru, tetapi status wajib pending.
drop policy if exists "Public can submit pending scripts" on public.scripts;
create policy "Public can submit pending scripts"
on public.scripts for insert
to anon, authenticated
with check (
  status = 'pending'
  and char_length(trim(game_name)) between 2 and 80
  and char_length(trim(script_name)) between 2 and 100
  and char_length(trim(description)) between 10 and 500
  and char_length(code) between 3 and 20000
);

-- Admin yang terdaftar dapat mengubah status dan mengelola script.
drop policy if exists "Admins can update scripts" on public.scripts;
create policy "Admins can update scripts"
on public.scripts for update
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

drop policy if exists "Admins can delete scripts" on public.scripts;
create policy "Admins can delete scripts"
on public.scripts for delete
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

-- Pengunjung tidak boleh membaca daftar admin. Admin boleh membaca daftar ini.
drop policy if exists "Admins can read admin list" on public.admin_users;
create policy "Admins can read admin list"
on public.admin_users for select
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

-- Setelah membuat akun di Authentication > Users, masukkan UUID akun admin:
-- insert into public.admin_users (user_id) values ('PASTE-AUTH-USER-UUID-HERE');
