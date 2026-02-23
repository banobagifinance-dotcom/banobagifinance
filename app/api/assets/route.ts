import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isValidAssetId, type Asset } from "@/lib/supabase";

const BUCKET = "assets";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data as Asset[]);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const formData = await request.formData();
    const asset_id = (formData.get("asset_id") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const date = (formData.get("date") as string)?.trim();
    const price = formData.get("price");
    const image = formData.get("image") as File | null;

    if (!asset_id || !name || !date) {
      return NextResponse.json(
        { error: "กรุณากรอก ID, ชื่อ และวันที่" },
        { status: 400 }
      );
    }
    if (!isValidAssetId(asset_id)) {
      return NextResponse.json(
        { error: "รูปแบบ ID ต้องเป็น XX-XX-XXX เช่น EQ-25-034, AQ-01-001 (ตัวอักษร 2 ตัว แล้วตามด้วย - ตัวเลข 2 หลัก - ตัวเลข 3 หลัก)" },
        { status: 400 }
      );
    }

    const priceNum = price != null ? Number(price) : 0;
    if (Number.isNaN(priceNum)) {
      return NextResponse.json({ error: "ราคาต้องเป็นตัวเลข" }, { status: 400 });
    }

    let image_url: string | null = null;
    if (image && image.size > 0) {
      const ext = image.name.split(".").pop() || "jpg";
      const path = `${asset_id}-${Date.now()}.${ext}`;
      const buf = Buffer.from(await image.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: image.type, upsert: true });
      if (uploadError) {
        console.error(uploadError);
        return NextResponse.json(
          { error: "อัปโหลดรูปไม่สำเร็จ: " + uploadError.message },
          { status: 500 }
        );
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        asset_id,
        name,
        date,
        price: priceNum,
        image_url,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "รหัส ID นี้มีอยู่แล้ว" }, { status: 400 });
      }
      throw error;
    }
    return NextResponse.json(data as Asset);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create asset" },
      { status: 500 }
    );
  }
}
