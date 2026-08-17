"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

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

  if (status === "sent") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl">
          ✉️
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Check your email
        </h1>
        <p className="text-sm text-neutral-600">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this
          device to continue.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-violet-600" />
          <span className="text-xl font-bold text-neutral-900">
            EduCircle
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">Parents. Together.</p>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Find the right school for your child
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Real experiences, honest conversations, schools that fit your
          family.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Continue"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    </main>
  );
}
