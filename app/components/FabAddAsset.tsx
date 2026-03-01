"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function FabAddAsset() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user) return null;
  if (pathname === "/add" || pathname === "/print") return null;
  if (pathname?.startsWith("/asset/") && pathname?.endsWith("/edit")) return null;

  return (
    <Link
      href="/add"
      className="no-print fixed bottom-20 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-400 focus:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label="เพิ่มสินทรัพย์"
    >
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  );
}
