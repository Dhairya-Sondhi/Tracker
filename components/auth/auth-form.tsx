"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { AuthField, PasswordField } from "@/components/auth/auth-fields";
import { AuthCard, AuthShell } from "@/components/auth/auth-shell";

type Mode = "signin" | "signup";
type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

export function AuthForm({ mode,notice }: { mode: Mode;notice?:string }) {
  const router = useRouter(); const signup = mode === "signup";
  const [error, setError] = useState(""); const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); const [loading, setLoading] = useState(false);
  useEffect(() => { router.prefetch("/today"); if (!signup) router.prefetch("/admin"); }, [router, signup]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return;
    const form = new FormData(event.currentTarget); const password = String(form.get("password") || ""); const confirmPassword = String(form.get("confirmPassword") || ""); const nextErrors: FieldErrors = {};
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (signup && password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    setFieldErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password, displayName: form.get("displayName") }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(safeError(mode, response.status, data?.message)); setLoading(false); return; }
      const redirectTo = data?.redirectTo === "/admin" ? "/admin" : data?.redirectTo === "/signin" ? "/signin?message=check-email" : "/today";
      router.replace(redirectTo);
    } catch { setError(serverError(mode)); setLoading(false); }
  }
  return <AuthShell><AuthCard>
    <p className="text-xs font-bold uppercase tracking-[.16em] text-lavender">{signup ? "Your private workspace" : "Your space awaits"}</p>
    <h1 className="mt-3 text-[clamp(2.15rem,8vw,2.7rem)] font-semibold leading-[1.05] tracking-[-.055em]">{signup ? "Create your space." : "Welcome back."}</h1>
    <p className="mt-4 text-[15px] leading-7 text-white/70">{signup ? "A private place to plan, track, and understand your growth." : "Pick up where you left off."}</p>
    {notice && <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-100">{notice}</p>}
    <form onSubmit={submit} className="mt-8 space-y-5" aria-describedby={error ? "auth-error" : undefined} noValidate>
      {signup && <AuthField name="displayName" label="Name" placeholder="Alex" autoComplete="name" maxLength={100} />}
      <AuthField name="email" label="Email" placeholder="alex@email.com" type="email" autoComplete="email" inputMode="email" />
      <PasswordField name="password" label="Password" autoComplete={signup ? "new-password" : "current-password"} error={fieldErrors.password} />
      {!signup && <div className="-mt-3 text-right"><Link href="/forgot-password" className="focus-ring rounded text-xs font-semibold text-white/50 hover:text-white">Forgot password?</Link></div>}
      {signup && <PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" error={fieldErrors.confirmPassword} />}
      {signup && !fieldErrors.password && <p className="-mt-2 text-xs text-white/55">Use at least 8 characters.</p>}{error && <AuthError message={error} />}
      <button disabled={loading} className="focus-ring flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#0c0b10] shadow-[0_10px_30px_rgba(255,255,255,.08)] transition hover:bg-lilac active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-65"><LoaderCircle aria-hidden="true" className={loading ? "animate-spin" : "invisible"} size={16} /><span>{loading ? (signup ? "Creating your space…" : "Signing in…") : (signup ? "Create my space" : "Sign in")}</span></button>
    </form>
    <p className="mt-7 text-center text-sm text-white/65">{signup ? "Already have an account?" : "New here?"}{" "}<Link className="focus-ring rounded font-bold text-white transition hover:text-lilac" href={signup ? "/signin" : "/signup"}>{signup ? "Sign in" : "Create your space"}</Link></p>
  </AuthCard></AuthShell>;
}

function safeError(mode: Mode, status: number, message?: unknown) {
  if (mode === "signin" && status === 401) return "Email or password is incorrect.";
  if (mode === "signup" && status === 409) return "An account with this email already exists.";
  const allowed = ["Check your name, email, and password.", "Enter a valid email address.", "Enter a valid email and password.", "This account is currently disabled."];
  return typeof message === "string" && allowed.includes(message) ? message : serverError(mode);
}

function serverError(mode: Mode) {
  return mode === "signup" ? "We couldn't create your account right now. Please try again." : "We couldn't sign you in right now. Please try again.";
}
