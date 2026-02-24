"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Asset } from "@/lib/supabase";
import { toDirectImageUrl, isDriveUrl } from "@/lib/drive-image-url";
import { ID_PREFIX_LABELS } from "@/lib/asset-id-labels";

type SortOption = "az" | "za" | "latest" | "price_desc" | "price_asc";
type PageSizeOption = "15" | "50" | "100" | "all";
type CategoryFilterOption = "" | "EQ" | "FU" | "KM";
type StatusFilterOption = "" | "Active" | "Sold";

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("az");
  const [pageSize, setPageSize] = useState<PageSizeOption>("15");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterOption>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const filteredAssets = assets
    .filter((a) => {
      if (statusFilter) {
        const s = (a.status ?? "Active").trim() || "Active";
        if (s !== statusFilter) return false;
      }
      if (categoryFilter) {
        const prefix = a.asset_id.toUpperCase().split("-")[0] ?? "";
        if (prefix !== categoryFilter) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          a.asset_id.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sort === "latest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "price_desc") {
      return (b.price ?? 0) - (a.price ?? 0);
    }
    if (sort === "price_asc") {
      return (a.price ?? 0) - (b.price ?? 0);
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

  const filterSelects = (
    <>
      <select
        value={categoryFilter}
        onChange={(e) => {
          setCategoryFilter(e.target.value as CategoryFilterOption);
          setPage(1);
          setMenuOpen(false);
        }}
        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full md:w-auto transition-colors duration-200"
        aria-label="กรองตามประเภท"
      >
        <option value="">ทั้งหมด</option>
        {Object.entries(ID_PREFIX_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {code} = {label}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value as StatusFilterOption);
          setPage(1);
          setMenuOpen(false);
        }}
        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full md:w-auto transition-colors duration-200"
        aria-label="กรองตามสถานะ"
      >
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Sold">Sold</option>
      </select>
      <select
        value={pageSize}
        onChange={(e) => {
          setPageSize(e.target.value as PageSizeOption);
          setPage(1);
          setMenuOpen(false);
        }}
        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full md:w-auto transition-colors duration-200"
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
          setMenuOpen(false);
        }}
        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full md:w-auto transition-colors duration-200"
        aria-label="เรียงลำดับ"
      >
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
        <option value="latest">อัพเดตล่าสุด</option>
        <option value="price_desc">ราคา: มาก → น้อย</option>
        <option value="price_asc">ราคา: น้อย → มาก</option>
      </select>
    </>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-100">
            สินทรัพย์ทั้งหมด
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-row gap-3 items-center flex-wrap">
              {filterSelects}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label="เปิดเมนูฟิลเตอร์"
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            menuOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-300">ฟิลเตอร์</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="ปิดเมนู"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {filterSelects}
          </div>
        </div>
      </div>

      {/* ช่องค้นหา sticky แยกออกจาก flex เพื่อให้ position:sticky ทำงาน */}
      <div className="sticky top-0 z-20 bg-slate-900 py-2 -mx-0 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="ค้นจาก ID หรือ Name"
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors duration-200"
          aria-label="ค้นหาสินทรัพย์จาก ID หรือ Name"
        />
      </div>
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-12 text-center text-slate-400">
          ยังไม่มีสินทรัพย์{" "}
          <Link href="/add" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors duration-200">
            เพิ่มสินทรัพย์
          </Link>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-12 text-center text-slate-400">
          {search.trim()
            ? `ไม่พบรายการที่ตรงกับคำค้น "${search.trim()}"${categoryFilter ? ` ในประเภท ${categoryFilter}` : ""}${statusFilter ? ` สถานะ ${statusFilter}` : ""}`
            : statusFilter
              ? `ไม่พบรายการสถานะ ${statusFilter}${categoryFilter ? ` ในประเภท ${categoryFilter}` : ""}`
              : categoryFilter
                ? `ไม่พบรายการในประเภท ${categoryFilter} (${ID_PREFIX_LABELS[categoryFilter]})`
                : "ไม่พบรายการ"}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {paginatedAssets.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/asset/${a.asset_id}`}
                  className="block rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-600 hover:scale-[1.02] transition-all duration-200 ease-out"
                >
                  <div className="aspect-square bg-slate-700 relative">
                    {a.status === "Sold" && (
                      <span className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-red-600 text-white text-xs font-bold uppercase tracking-wide shadow">
                        Sold
                      </span>
                    )}
                    {a.image_url ? (
                      isDriveUrl(a.image_url) ? (
                        <img
                          src={toDirectImageUrl(a.image_url) ?? a.image_url}
                          alt={a.name}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={toDirectImageUrl(a.image_url) ?? a.image_url}
                          alt={a.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 20vw"
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-4xl">
                        —
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <span className="font-mono font-semibold text-slate-100">
                      {a.asset_id.toUpperCase()}
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
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                หน้าแรก
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="ก่อนหน้า"
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 text-lg leading-none"
              >
                ←
              </button>
              <div className="flex items-center gap-1">
                {showPages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[2.5rem] py-2 rounded-lg border transition-colors duration-200 ${
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
                aria-label="ถัดไป"
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 text-lg leading-none"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                หน้าสุดท้าย
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
