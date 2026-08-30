"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "checking" | "ready" | "working" | "done" | "expired" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState("");

  // Reaching this page means /auth/confirm already traded the recovery code
  // for a session. Without one there is nothing to update.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "ready" : "expired");
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setStatus("error");
      setErrorMessage(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setStatus("working");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("done");
    router.refresh();
  }

  return (
    <AuthShell
      heading={<>Set a new password.</>}
      subheading="Pick something you'll remember — you'll use it every time you sign in."
    >
      {status === "checking" && (
        <p className="py-8 text-center text-sm text-neutral-500">Checking…</p>
      )}

      {status === "expired" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
            ⏳
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            This link has expired
          </h2>
          <p className="text-sm text-neutral-600">
            Reset links can only be used once, and not long after they&apos;re
            sent.
          </p>
          <Link
            href="/forgot-password"
            className="mt-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Send a new link
          </Link>
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✅
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Password updated
          </h2>
          <Link
            href="/network"
            className="mt-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Continue to EduCircle
          </Link>
        </div>
      )}

      {(status === "ready" || status === "working" || status === "error") && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900">
              New password
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={MIN_PASSWORD}
                placeholder={`New password (${MIN_PASSWORD}+ characters)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 py-3 pl-4 pr-10 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <button
              type="submit"
              disabled={status === "working"}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {status === "working" ? "Saving..." : "Save password"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        </div>
      )}
    </AuthShell>
  );
}
