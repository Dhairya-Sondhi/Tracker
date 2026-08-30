export function AuthError({ message }: { message: string }) {
  return <div id="auth-error" role="alert" aria-live="polite" className="rounded-xl border border-negative/30 bg-negative/10 px-4 py-3 text-sm leading-6 text-white/90">{message}</div>;
}
