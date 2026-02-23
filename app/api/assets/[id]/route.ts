import { NextRequest, NextResponse } from "next/server";
import { getSupabase, type Asset } from "@/lib/supabase";

const BUCKET = "assets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("asset_id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json(data as Asset);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("id, image_url")
      .eq("asset_id", id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }

    if (asset.image_url) {
      try {
        const pathname = new URL(asset.image_url).pathname;
        const path = pathname.split(`/${BUCKET}/`)[1]?.split("?")[0];
        if (path) await supabase.storage.from(BUCKET).remove([path]);
      } catch (_) {}
    }

    const { error: deleteError } = await supabase
      .from("assets")
      .delete()
      .eq("id", asset.id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete asset" },
      { status: 500 }
    );
  }
}
