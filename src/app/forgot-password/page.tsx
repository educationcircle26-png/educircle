"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "sent">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("working");

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    // Always report success. Saying "no account with that email" would let
    // anyone test which addresses are registered here.
    setStatus("sent");
  }

  return (
    <AuthShell
      heading={<>Forgot your password?</>}
      subheading="It happens. We'll email you a link to set a new one."
    >
      {status === "sent" ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl">
            ✉️
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Check your email
          </h2>
          <p className="text-sm text-neutral-600">
            If an account exists for <strong>{email}</strong>, a reset link is
            on its way.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-violet-600 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900">
              Reset password
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Enter the email you signed up with.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            />
            <button
              type="submit"
              disabled={status === "working"}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {status === "working" ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
