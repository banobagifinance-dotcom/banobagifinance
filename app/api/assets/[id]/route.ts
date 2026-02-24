import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import {
  getAssetByAssetId,
  deleteAssetByAssetId,
  updateAsset,
  ensureHeader,
} from "@/lib/sheets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureHeader();
    const data = await getAssetByAssetId(id);
    if (!data) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }
    return NextResponse.json(data);
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
    const asset = await getAssetByAssetId(id);
    if (!asset) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }

    const deleted = await deleteAssetByAssetId(asset.asset_id);
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }
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
    const existing = await getAssetByAssetId(asset_id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const date = (formData.get("date") as string)?.trim();
    const price = formData.get("price");
    const description = (formData.get("description") as string)?.trim() || null;
    const image_url = (formData.get("image_url") as string)?.trim() || null;
    const status = ((formData.get("status") as string)?.trim() || "Active") as "Active" | "Sold";
    const sold_date = (formData.get("sold_date") as string)?.trim() || null;

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
    if (status === "Sold" && !sold_date) {
      return NextResponse.json({ error: "กรุณาใส่วันที่ขายเมื่อสถานะเป็น Sold" }, { status: 400 });
    }

    await ensureHeader();
    const data = await updateAsset(asset_id, {
      name,
      date,
      price: priceNum,
      description,
      image_url: image_url || null,
      status,
      sold_date: status === "Sold" ? sold_date : null,
    });
    if (!data) {
      return NextResponse.json({ error: "ไม่พบสินทรัพย์" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update asset" },
      { status: 500 }
    );
  }
}
