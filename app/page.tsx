"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Asset } from "@/lib/supabase";

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/assets")
      .then(async (res) => {
        const text = await res.text();
        let data: { error?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(res.ok ? "ตอบกลับไม่ถูกต้อง" : text || "โหลดข้อมูลไม่สำเร็จ");
        }
        if (!res.ok) {
          throw new Error(data.error || text || "โหลดข้อมูลไม่สำเร็จ");
        }
        return data as Asset[];
      })
      .then(setAssets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
        {error}
        <p className="mt-2 text-sm">ตรวจสอบว่าได้ตั้งค่า Supabase ใน .env.local แล้ว</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        สินทรัพย์ทั้งหมด
      </h1>
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center text-slate-500">
          ยังไม่มีสินทรัพย์{" "}
          <Link href="/add" className="text-sky-600 dark:text-sky-400 hover:underline">
            เพิ่มสินทรัพย์
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((a) => (
            <li key={a.id}>
              <Link
                href={`/asset/${a.asset_id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative">
                  {a.image_url ? (
                    <Image
                      src={a.image_url}
                      alt={a.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-4xl">
                      —
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {a.asset_id}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
