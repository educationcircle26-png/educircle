"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { GoogleIcon } from "@/components/GoogleIcon";

const MIN_PASSWORD = 8;

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "working" | "confirm" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setStatus("error");
      setErrorMessage(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setStatus("working");
    setErrorMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // With email confirmation switched on, signUp returns no session — the
    // account only becomes usable once the link is opened.
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
    } else {
      setStatus("confirm");
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  if (status === "confirm") {
    return (
      <AuthShell
        heading={<>Almost there.</>}
        subheading="One click on the link we sent and you're in."
      >
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl">
            ✉️
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Confirm your email
          </h2>
          <p className="text-sm text-neutral-600">
            We sent a confirmation link to <strong>{email}</strong>. Open it to
            activate your account.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-violet-600 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading={
        <>
          Join the
          <br />
          parents&apos; circle.
        </>
      }
      subheading="A free, private community for parents to share experiences, opinions, and insights about schools and education."
    >
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={handleGoogle}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">
            Create account
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Free, and takes a minute.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          Or, using Email
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={MIN_PASSWORD}
              placeholder={`Password (${MIN_PASSWORD}+ characters)`}
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
            {status === "working" ? "Creating account..." : "Create account"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </form>

        <p className="text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
