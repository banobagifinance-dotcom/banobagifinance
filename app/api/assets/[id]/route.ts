import { NextRequest, NextResponse } from "next/server";
import { getSupabase, type Asset } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";

const BUCKET = "assets";

function getStoragePathFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split(`/${BUCKET}/`)[1]?.split("?")[0] ?? null;
  } catch {
    return null;
  }
}

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
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
      const path = getStoragePathFromUrl(asset.image_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    const { id: asset_id } = await params;
    const supabase = getSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("assets")
      .select("id, image_url")
      .eq("asset_id", asset_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const date = (formData.get("date") as string)?.trim();
    const price = formData.get("price");
    const description = (formData.get("description") as string)?.trim() || null;
    const image = formData.get("image") as File | null;

    if (!name || !date) {
      return NextResponse.json(
        { error: "กรุณากรอก ชื่อ และวันที่" },
        { status: 400 }
      );
    }

    const priceNum = price != null ? Number(price) : 0;
    if (Number.isNaN(priceNum)) {
      return NextResponse.json({ error: "ราคาต้องเป็นตัวเลข" }, { status: 400 });
    }

    let image_url: string | null = existing.image_url;

    if (image && image.size > 0) {
      const ext = image.name.split(".").pop() || "jpg";
      const path = `${asset_id}-${Date.now()}.${ext}`;
      const buf = Buffer.from(await image.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: image.type, upsert: true });
      if (uploadError) {
        return NextResponse.json(
          { error: "อัปโหลดรูปไม่สำเร็จ: " + uploadError.message },
          { status: 500 }
        );
      }
      if (existing.image_url) {
        const oldPath = getStoragePathFromUrl(existing.image_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("assets")
      .update({
        name,
        date,
        price: priceNum,
        description,
        image_url,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data as Asset);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update asset" },
      { status: 500 }
    );
  }
}
