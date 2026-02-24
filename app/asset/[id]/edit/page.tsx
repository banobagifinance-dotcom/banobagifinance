"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Asset } from "@/lib/supabase";
import { toDirectImageUrl } from "@/lib/drive-image-url";
import { getAssetIdPrefixLabel } from "@/lib/asset-id-labels";
import { formatSheetDate, parseSheetDateParts, toSheetDateString, THAI_MONTHS } from "@/lib/date-utils";

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    price: "",
    description: "",
    image_url: "",
    status: "Active" as "Active" | "Sold",
    sold_date: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent(`/asset/${id}/edit`));
    }
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/assets/${encodeURIComponent(id)}`)
      .then((res) => {
        if (res.status === 404) {
          setError("ไม่พบสินทรัพย์");
          return null;
        }
        if (!res.ok) throw new Error("โหลดไม่สำเร็จ");
        return res.json();
      })
      .then((data: Asset | null) => {
        if (data) {
          setAsset(data);
          setForm({
            name: data.name,
            date: data.date.slice(0, 10),
            price: String(data.price ?? ""),
            description: data.description ?? "",
            image_url: data.image_url ?? "",
            status: (data.status === "Sold" ? "Sold" : "Active") as "Active" | "Sold",
            sold_date: data.sold_date?.trim()?.slice(0, 10)
              ?? (data.status === "Sold" ? "2568-01-01" : ""),
          });
        }
      })
      .catch(() => setError("โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.set("name", form.name.trim());
    fd.set("date", form.date);
    fd.set("price", form.price.trim() || "0");
    fd.set("description", form.description.trim());
    if (form.image_url.trim()) fd.set("image_url", form.image_url.trim());
    fd.set("status", form.status);
    if (form.status === "Sold" && form.sold_date.trim()) fd.set("sold_date", form.sold_date.trim());
    const token = getAccessToken();
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(asset.asset_id)}`, {
        method: "PATCH",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      router.push(`/asset/${asset.asset_id}`);
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="rounded-lg bg-amber-900/20 border border-amber-700 p-4">
        <p className="text-amber-200">{error || "ไม่พบข้อมูล"}</p>
        <Link href="/" className="mt-3 inline-block text-sky-400 hover:underline">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">แก้ไขสินทรัพย์</h1>
      <p className="font-mono text-slate-400 mb-1">{asset.asset_id.toUpperCase()}</p>
      {getAssetIdPrefixLabel(asset.asset_id.split("-")[0] ?? "") ? (
        <p className="text-sm text-slate-500 mb-6">{getAssetIdPrefixLabel(asset.asset_id.split("-")[0] ?? "")}</p>
      ) : (
        <div className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">ID</label>
          <input
            type="text"
            value={asset.asset_id.toUpperCase()}
            disabled
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
          />
          {getAssetIdPrefixLabel(asset.asset_id.split("-")[0] ?? "") ? (
            <p className="text-xs text-slate-400 mt-1">{getAssetIdPrefixLabel(asset.asset_id.split("-")[0] ?? "")}</p>
          ) : null}
          <p className="text-xs text-slate-500 mt-1">ไม่สามารถแก้ไข ID ได้</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ชื่อสินทรัพย์"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="0"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-300 mb-2">สถานะ</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Active"
                checked={form.status === "Active"}
                onChange={() => setForm((f) => ({ ...f, status: "Active", sold_date: "" }))}
                className="rounded-full border-slate-500 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-slate-200">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Sold"
                checked={form.status === "Sold"}
                onChange={() => setForm((f) => ({ ...f, status: "Sold", sold_date: f.sold_date || "2568-01-01" }))}
                className="rounded-full border-slate-500 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-slate-200">Sold</span>
            </label>
          </div>
          {form.status === "Sold" && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-400 mb-1">วันที่ขาย (วัน เดือน ปี พ.ศ.)</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">วัน</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required={form.status === "Sold"}
                    value={(() => {
                      const p = parseSheetDateParts(form.sold_date);
                      return p ? p.day : 1;
                    })()}
                    onChange={(e) => {
                      const p = parseSheetDateParts(form.sold_date) ?? { day: 1, month: 1, year: 2568 };
                      const day = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1));
                      setForm((f) => ({ ...f, sold_date: toSheetDateString(day, p.month, p.year) }));
                    }}
                    className="w-14 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100 text-center"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">เดือน</span>
                  <select
                    required={form.status === "Sold"}
                    value={(() => {
                      const p = parseSheetDateParts(form.sold_date);
                      return p ? p.month : 1;
                    })()}
                    onChange={(e) => {
                      const p = parseSheetDateParts(form.sold_date) ?? { day: 1, month: 1, year: 2568 };
                      const month = parseInt(e.target.value, 10) || 1;
                      setForm((f) => ({ ...f, sold_date: toSheetDateString(p.day, month, p.year) }));
                    }}
                    className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100 min-w-[120px]"
                  >
                    {THAI_MONTHS.map((name, i) => (
                      <option key={i} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">ปี (พ.ศ.)</span>
                  <input
                    type="number"
                    min={2400}
                    max={2600}
                    required={form.status === "Sold"}
                    value={(() => {
                      const p = parseSheetDateParts(form.sold_date);
                      return p ? p.year : 2568;
                    })()}
                    onChange={(e) => {
                      const p = parseSheetDateParts(form.sold_date) ?? { day: 1, month: 1, year: 2568 };
                      const year = parseInt(e.target.value, 10) || 2568;
                      setForm((f) => ({ ...f, sold_date: toSheetDateString(p.day, p.month, year) }));
                    }}
                    className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100 text-center"
                  />
                </div>
              </div>
              {form.sold_date ? (
                <p className="text-sm text-slate-400 mt-1">{formatSheetDate(form.sold_date)}</p>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            รายละเอียดสินทรัพย์
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="รายละเอียดเพิ่มเติม"
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">ลิงค์รูปภาพ</label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="https://... (เช่น ลิงค์จาก Google Drive / Google Photos)"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500"
          />
          {form.image_url.trim() ? (
            <div className="mt-2 rounded-lg border border-slate-600 overflow-hidden bg-slate-800 inline-block max-w-[200px]">
              <img
                src={toDirectImageUrl(form.image_url.trim()) ?? form.image_url.trim()}
                alt="พรีวิว"
                referrerPolicy="no-referrer"
                className="max-h-40 w-auto object-contain block"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : null}
          <p className="text-xs text-slate-500 mt-1">เว้นว่างไว้ถ้าไม่ต้องการใส่รูป</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors duration-200"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
          <Link
            href={`/asset/${asset.asset_id}`}
            className="py-3 px-4 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-center transition-colors duration-200"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
