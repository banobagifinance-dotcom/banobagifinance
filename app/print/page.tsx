"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/auth-context";
import type { Asset } from "@/lib/supabase";
import { ID_PREFIX_LABELS } from "@/lib/asset-id-labels";

type PrintStatusFilter = "Active" | "All" | "Sold";
type CategoryFilterOption = "" | "EQ" | "FU" | "KM" | "OT";

export default function PrintQrPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PrintStatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterOption>("");
  const [colsInput, setColsInput] = useState("6");
  const [rowsInput, setRowsInput] = useState("6");
  const [showPreview, setShowPreview] = useState(false);

  const colsNum = Math.max(1, Math.min(12, parseInt(colsInput, 10) || 1));
  const rowsNum = Math.max(1, Math.min(12, parseInt(rowsInput, 10) || 1));
  const itemsPerPage = colsNum * rowsNum;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent("/print"));
      return;
    }
  }, [authLoading, user, router]);

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

  const filteredAssets = assets.filter((a) => {
    const s = (a.status ?? "Active").trim() || "Active";
    if (statusFilter !== "All" && s !== statusFilter) return false;
    if (categoryFilter) {
      const prefix = a.asset_id.toUpperCase().split("-")[0] ?? "";
      if (prefix !== categoryFilter) return false;
    }
    return true;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) =>
    a.asset_id.localeCompare(b.asset_id, "th")
  );

  const pages = (() => {
    const result: Asset[][] = [];
    for (let i = 0; i < sortedAssets.length; i += itemsPerPage) {
      const chunk = sortedAssets.slice(i, i + itemsPerPage);
      if (chunk.length > 0) result.push(chunk);
    }
    return result;
  })();

  // A4: 210mm x 297mm, margin 10mm → content 190mm x 277mm, gap 2mm
  const contentWidthMm = 190;
  const contentHeightMm = 277;
  const gapMm = 2;
  const cellWidthMm = (contentWidthMm - (colsNum - 1) * gapMm) / colsNum;
  const cellHeightMm = (contentHeightMm - (rowsNum - 1) * gapMm) / rowsNum;
  const qrSizeMm = Math.floor(Math.min(cellWidthMm - 4, cellHeightMm - 8));
  const qrSizePx = Math.max(60, Math.round(qrSizeMm * 3.8));

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-300">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
      <div className="flex flex-col gap-4 mb-6 print:hidden items-center text-center">
        <h1 className="text-2xl font-bold text-slate-100">ปริ้น QR Code ทั้งหมด</h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className="text-sm text-slate-300">หมวด:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilterOption)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(ID_PREFIX_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {code} = {label}
              </option>
            ))}
          </select>
          <label className="text-sm text-slate-300">Layout:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={12}
              value={colsInput}
              onChange={(e) => setColsInput(e.target.value)}
              className="w-14 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100 text-center focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="จำนวนคอลัมน์"
            />
            <span className="text-slate-400">×</span>
            <input
              type="number"
              min={1}
              max={12}
              value={rowsInput}
              onChange={(e) => setRowsInput(e.target.value)}
              className="w-14 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100 text-center focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="จำนวนแถว"
            />
            <span className="text-sm text-slate-500">คอลัมน์ × แถว/หน้า</span>
          </div>
          <label className="text-sm text-slate-300">สถานะ:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PrintStatusFilter)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="All">ทั้งหมด (All)</option>
            <option value="Active">Active เท่านั้น</option>
            <option value="Sold">Sold เท่านั้น</option>
          </select>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 transition-colors"
          >
            แสดง Print Preview
          </button>
          {showPreview && (
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors"
            >
              ปริ้น
            </button>
          )}
          <Link
            href="/"
            className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>

      {!showPreview ? (
        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-8 text-center text-slate-400 print:hidden">
          เลือกหมวด สถานะ Layout (คอลัมน์ × แถว) แล้วกด <strong className="text-slate-300">แสดง Print Preview</strong> เพื่อดูก่อนปริ้น
          <p className="mt-2 text-sm">
            {filteredAssets.length} รายการที่เลือก · ใช้กระดาษ A4
          </p>
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-8 text-center text-slate-400 print:hidden">
          ไม่มีรายการที่ตรงกับตัวกรอง
        </div>
      ) : (
        <div className="print:block">
          {/* Print Preview - A4 layout (scaled on screen, full size when print) */}
          {pages.map((pageAssets, pageIdx) => (
            <div
              key={pageIdx}
              className="print-qr-page mb-8 print:mb-0 print:break-after-page mx-auto bg-white text-slate-800 rounded-lg shadow-xl overflow-hidden"
              style={{
                width: "210mm",
                height: "297mm",
                maxWidth: "100%",
                padding: "10mm",
                boxSizing: "border-box",
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${colsNum}, 1fr)`,
                  gridTemplateRows: `repeat(${rowsNum}, 1fr)`,
                  gap: `${gapMm}mm`,
                  width: `${contentWidthMm}mm`,
                  height: `${contentHeightMm}mm`,
                  boxSizing: "border-box",
                }}
              >
                {pageAssets.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col items-center justify-center border border-slate-200 rounded overflow-hidden"
                    style={{
                      width: `${cellWidthMm}mm`,
                      height: `${cellHeightMm}mm`,
                      padding: "1mm",
                      border: "1px solid #e2e8f0",
                      borderRadius: "1mm",
                      boxSizing: "border-box",
                    }}
                  >
                    <p
                      className="font-mono font-bold text-center shrink-0 leading-tight"
                      style={{ fontSize: "8pt", marginBottom: "0.5mm" }}
                    >
                      {a.asset_id.toUpperCase()}
                    </p>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: `${qrSizeMm}mm`, height: `${qrSizeMm}mm` }}
                    >
                      <QRCodeCanvas
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/asset/${a.asset_id}`
                            : "#"
                        }
                        size={qrSizePx}
                        level="M"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
