"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (user) {
    router.replace(redirect);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace(redirect);
    router.refresh();
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">เข้าสู่ระบบ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            อีเมล
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 transition-colors duration-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            รหัสผ่าน
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 transition-colors duration-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors duration-200"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
      <p className="mt-4 text-center text-slate-400 text-sm">
        <Link href="/" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors duration-200">
          กลับหน้าแรก
        </Link>
      </p>
    </div>
  );
}
