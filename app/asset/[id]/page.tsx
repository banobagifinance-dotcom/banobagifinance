"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { Asset } from "@/lib/supabase";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      .then((data) => {
        if (data) setAsset(data);
      })
      .catch(() => setError("โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!asset || !confirm("ต้องการลบสินทรัพย์นี้ใช่หรือไม่?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(asset.asset_id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "ลบไม่สำเร็จ");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const qrUrl =
    typeof window !== "undefined" ? `${window.location.origin}/asset/${id}` : "";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-amber-800 dark:text-amber-200">{error || "ไม่พบข้อมูล"}</p>
        <Link href="/" className="mt-3 inline-block text-sky-600 dark:text-sky-400 hover:underline">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  const dateDisplay = asset.date
    ? new Date(asset.date + "Z").toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative">
          {asset.image_url ? (
            <Image
              src={asset.image_url}
              alt={asset.name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 32rem"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-6xl">
              —
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">ID</span>
            <p className="font-mono text-xl font-semibold text-slate-800 dark:text-slate-100">
              {asset.asset_id}
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Name</span>
            <p className="text-slate-800 dark:text-slate-100">{asset.name}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
            <p className="text-slate-800 dark:text-slate-100">{dateDisplay}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Price</span>
            <p className="text-slate-800 dark:text-slate-100">
              {Number(asset.price).toLocaleString("th-TH")} บาท
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">QR Code สำหรับสินทรัพย์นี้</p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 inline-block">
            <QRCodeSVG value={qrUrl} size={180} level="M" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="flex-1 py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-center"
        >
          กลับหน้าแรก
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "กำลังลบ..." : "ลบสินทรัพย์"}
        </button>
      </div>
    </div>
  );
}
