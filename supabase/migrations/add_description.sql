-- รันใน Supabase SQL Editor ถ้าตาราง assets มีอยู่แล้ว (เพื่อเพิ่มคอลัมน์ description)
alter table public.assets add column if not exists description text;
