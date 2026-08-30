"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { GoogleIcon } from "@/components/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Filling in a password signs in directly; leaving it blank falls back to
  // the emailed link, which is still the only route for accounts that were
  // created through Google and never set one.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();

    if (password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      // refresh() so the server components pick up the new session cookie.
      router.replace("/network");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
  }

  return (
    <AuthShell
      heading={
        <>
          Welcome Back,
          <br />
          Parents.
        </>
      }
      subheading="A free, private community for parents to share experiences, opinions, and insights about schools and education."
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
            We sent a sign-in link to <strong>{email}</strong>. Open it on this
            device to continue.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900">Log In</h2>
            <p className="mt-1 text-sm text-neutral-500">👋 Welcome back!</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" />
            Or, using Email
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                ✉️
              </span>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-3 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-10 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
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

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">
                Leave it empty for an emailed link.
              </p>
              <Link
                href="/forgot-password"
                className="shrink-0 text-xs font-medium text-violet-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {status === "sending"
                ? password
                  ? "Signing in..."
                  : "Sending link..."
                : "Log In"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </form>

          <p className="text-center text-sm text-neutral-600">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-violet-600 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
