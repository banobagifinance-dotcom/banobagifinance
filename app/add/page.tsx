"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/auth-context";
import type { Asset } from "@/lib/supabase";

export default function AddAssetPage() {
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    asset_id: "",
    name: "",
    date: new Date().toISOString().slice(0, 10),
    price: "",
    description: "",
    image: null as File | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent("/add"));
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("asset_id", form.asset_id.trim());
    fd.set("name", form.name.trim());
    fd.set("date", form.date);
    fd.set("price", form.price.trim() || "0");
    if (form.description.trim()) fd.set("description", form.description.trim());
    if (form.image) fd.set("image", form.image);
    const token = getAccessToken();
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setCreated(data);
    } catch (err) {
      setError("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const qrUrl =
    typeof window !== "undefined" && created
      ? `${window.location.origin}/asset/${created.asset_id}`
      : "";
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveAsJpg = () => {
    if (!created || typeof document === "undefined") return;
    const container = qrContainerRef.current;
    const qrCanvas = container?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!qrCanvas) return;

    const padding = 24;
    const qrSize = 200;
    const idHeight = 40;
    const width = qrSize + padding * 2;
    const height = padding + idHeight + 16 + qrSize + padding;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(created.asset_id, width / 2, padding + 28);

    ctx.drawImage(qrCanvas, padding, padding + idHeight + 16, qrSize, qrSize);

    const link = document.createElement("a");
    link.download = `${created.asset_id}-qr.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">
        เพิ่มสินทรัพย์
      </h1>

      {created ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-6">
          <p className="text-green-600 dark:text-green-400 font-medium">
            เพิ่มสินทรัพย์สำเร็จ
          </p>
          <div ref={qrContainerRef} className="flex flex-col items-center gap-4">
            <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">
              {created.asset_id}
            </p>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <QRCodeCanvas value={qrUrl} size={200} level="M" />
            </div>
            <p className="text-sm text-slate-500">
              นำ QR Code ไปพิมพ์หรือติดบนสินทรัพย์ แล้วสแกนเพื่อดูรายละเอียด
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSaveAsJpg}
              className="w-full py-2 px-4 rounded-lg border-2 border-sky-600 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 font-medium transition-colors duration-200"
            >
              Save QR + ID เป็น JPG
            </button>
            <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setForm({
                  asset_id: "",
                  name: "",
                  date: new Date().toISOString().slice(0, 10),
                  price: "",
                  description: "",
                  image: null,
                });
              }}
              className="flex-1 py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              เพิ่มรายการใหม่
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 py-2 px-4 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors duration-200"
            >
              กลับหน้าแรก
            </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              ID <span className="text-slate-500">(รูปแบบ XX-25-034 เช่น EQ, AQ, CQ)</span>
            </label>
            <input
              type="text"
              required
              value={form.asset_id}
              onChange={(e) => setForm((f) => ({ ...f, asset_id: e.target.value }))}
              placeholder="EQ-25-034 หรือ AQ-01-001"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors duration-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ชื่อสินทรัพย์"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              รายละเอียดสินทรัพย์
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              ภาพ
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-sky-50 file:text-sky-700 dark:file:bg-sky-900/30 dark:file:text-sky-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? "กำลังบันทึก..." : "เพิ่มสินทรัพย์"}
          </button>
        </form>
      )}
    </div>
  );
}
