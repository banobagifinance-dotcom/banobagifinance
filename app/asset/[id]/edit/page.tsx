"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Asset } from "@/lib/supabase";

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
    image: null as File | null,
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
            image: null,
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
    if (form.image) fd.set("image", form.image);
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
      <p className="font-mono text-slate-400 mb-6">{asset.asset_id}</p>

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
            value={asset.asset_id}
            disabled
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
          />
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
          <label className="block text-sm font-medium text-slate-300 mb-1">ภาพ</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-sky-900/50 file:text-sky-300"
          />
          <p className="text-xs text-slate-500 mt-1">เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรูป</p>
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
