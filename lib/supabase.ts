import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export type Asset = {
  id: string;
  asset_id: string;
  name: string;
  date: string;
  price: number;
  image_url: string | null;
  created_at: string;
};

// ตัวอักษร 2 ตัว (EQ, AQ, CQ ฯลฯ) + - + ตัวเลข 2 หลัก + - + ตัวเลข 3 หลัก
export const ASSET_ID_REGEX = /^[A-Za-z]{2}-\d{2}-\d{3}$/;
export function isValidAssetId(id: string): boolean {
  return ASSET_ID_REGEX.test(id);
}
