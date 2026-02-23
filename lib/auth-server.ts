import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export async function getAuthUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
