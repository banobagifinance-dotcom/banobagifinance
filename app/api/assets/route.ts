import { NextRequest, NextResponse } from "next/server";
import { isValidAssetId } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { listAssets, createAsset, existsAssetId, ensureHeader } from "@/lib/sheets";

export async function GET() {
  try {
    await ensureHeader();
    const data = await listAssets();
    return NextResponse.json(data);
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
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    const formData = await request.formData();
    const asset_id = (formData.get("asset_id") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const date = (formData.get("date") as string)?.trim();
    const price = formData.get("price");
    const description = (formData.get("description") as string)?.trim() || null;
    const image_url = (formData.get("image_url") as string)?.trim() || null;

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

    if (await existsAssetId(asset_id)) {
      return NextResponse.json({ error: "รหัส ID นี้มีอยู่แล้ว" }, { status: 400 });
    }

    await ensureHeader();
    const data = await createAsset({
      asset_id,
      name,
      date,
      price: priceNum,
      description,
      image_url,
      status: "Active",
      sold_date: null,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create asset" },
      { status: 500 }
    );
  }
}
