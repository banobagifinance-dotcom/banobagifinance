"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Asset } from "@/lib/supabase";

type SortOption = "az" | "za" | "latest";
type PageSizeOption = "15" | "50" | "100" | "all";

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("az");
  const [pageSize, setPageSize] = useState<PageSizeOption>("15");

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

  const filteredAssets = search.trim()
    ? assets.filter(
        (a) =>
          a.asset_id.toLowerCase().includes(search.trim().toLowerCase()) ||
          a.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : assets;

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sort === "latest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    const cmp = a.asset_id.localeCompare(b.asset_id, "th");
    return sort === "za" ? -cmp : cmp;
  });

  const itemsPerPage =
    pageSize === "all" ? Math.max(1, sortedAssets.length) : Math.max(1, parseInt(pageSize, 10));
  const totalPages = Math.max(1, Math.ceil(sortedAssets.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = sortedAssets.slice(start, start + itemsPerPage);

  const showPages = (() => {
    const delta = 2;
    const range: number[] = [];
    const lo = Math.max(1, currentPage - delta);
    const hi = Math.min(totalPages, currentPage + delta);
    for (let i = lo; i <= hi; i++) range.push(i);
    return range;
  })();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          สินทรัพย์ทั้งหมด
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value as PageSizeOption);
              setPage(1);
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-auto"
            aria-label="จำนวนที่แสดง"
          >
            <option value="15">15</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-auto"
            aria-label="เรียงลำดับ"
          >
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
            <option value="latest">อัพเดตล่าสุด</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นจาก ID หรือ Name"
            className="w-full sm:min-w-[200px] rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label="ค้นหาสินทรัพย์จาก ID หรือ Name"
          />
        </div>
      </div>
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-12 text-center text-slate-400">
          ยังไม่มีสินทรัพย์{" "}
          <Link href="/add" className="text-sky-400 hover:underline">
            เพิ่มสินทรัพย์
          </Link>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-12 text-center text-slate-400">
          ไม่พบรายการที่ตรงกับคำค้น &quot;{search.trim()}&quot;
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {paginatedAssets.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/asset/${a.asset_id}`}
                  className="block rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-slate-700 relative">
                    {a.image_url ? (
                      <Image
                        src={a.image_url}
                        alt={a.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-4xl">
                        —
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <span className="font-mono font-semibold text-slate-100">
                      {a.asset_id}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="เลื่อนหน้า"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              <div className="flex items-center gap-1">
                {showPages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[2.5rem] py-2 rounded-lg border ${
                      p === currentPage
                        ? "border-sky-500 bg-sky-600 text-white"
                        : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
              <span className="ml-2 text-sm text-slate-400">
                หน้า {currentPage} / {totalPages}
                {search.trim() ? ` (พบ ${sortedAssets.length} รายการ)` : ` (ทั้งหมด ${assets.length} รายการ)`}
              </span>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
