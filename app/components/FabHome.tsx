"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function FabHome() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user) return null;
  const isAddPage = pathname === "/add";
  const isEditPage = pathname?.startsWith("/asset/") && pathname?.endsWith("/edit");
  if (!isAddPage && !isEditPage) return null;

  return (
    <Link
      href="/"
      className="fixed bottom-20 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-slate-600 text-white shadow-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label="กลับหน้าแรก"
    >
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </Link>
  );
}
