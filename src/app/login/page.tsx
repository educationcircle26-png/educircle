"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { ParentsIllustration } from "@/components/ParentsIllustration";
import { Logo } from "@/components/Logo";

const BADGES = [
  {
    label: "100% Parent Verified Community",
    icon: (
      <path
        d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Authentic Experiences",
    icon: (
      <>
        <path
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M12 14c-2.5-1.6-4-3-4-4.5A2 2 0 0 1 12 8a2 2 0 0 1 4 1.5c0 1.5-1.5 2.9-4 4.5z"
          fill="white"
        />
      </>
    ),
  },
  {
    label: "Complete Privacy & Safety",
    icon: (
      <>
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M8 10V7a4 4 0 0 1 8 0v3"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
      </>
    ),
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    // Password sign-in isn't wired up yet — this still sends an email link.
    const supabase = createClient();
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
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Hero panel */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-neutral-950 px-10 py-12 md:flex md:w-1/2">
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-amber-500/25 blur-3xl" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <h1 className="text-4xl font-bold text-white">
            Welcome Back,
            <br />
            Parents.
          </h1>
          <p className="mt-3 max-w-sm text-neutral-300">
            A free, private community for parents to share experiences,
            opinions, and insights about schools and education.
          </p>

          <div className="mt-8 flex gap-6">
            {BADGES.map((badge) => (
              <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    {badge.icon}
                  </svg>
                </span>
                <span className="text-xs text-neutral-300">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>

          <ParentsIllustration className="mt-10 w-full" />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-100 px-6 py-12 md:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl">
                ✉️
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Check your email
              </h2>
              <p className="text-sm text-neutral-600">
                We sent a sign-in link to <strong>{email}</strong>. Open it on
                this device to continue.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <Logo className="justify-center" />

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Log In
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  👋 Welcome back!
                </p>
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
                    placeholder="Password (coming soon)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-10 text-sm text-neutral-400 outline-none"
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

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" className="h-4 w-4" />
                    Remember me
                  </label>
                  <span className="text-neutral-400">Forgot password?</span>
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : "Log In"}
                </button>
                {status === "error" && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
              </form>

              <p className="text-center text-xs text-neutral-400">
                The largest parent community for knowledge and school
                experiences.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
