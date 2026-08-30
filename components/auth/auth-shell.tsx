import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main data-theme="dark" className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#09090d] px-5 py-24 text-white sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(115,86,232,.18),transparent_34%),radial-gradient(circle_at_78%_76%,rgba(255,196,168,.055),transparent_26%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.025] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:64px_64px]" />
      <Link href="/" aria-label="Form home" className="focus-ring absolute left-5 top-5 z-10 flex items-center gap-2.5 rounded-xl text-[15px] font-extrabold tracking-[-.03em] sm:left-8 sm:top-8">
        <span className="grid size-9 place-items-center rounded-xl bg-white text-black shadow-[0_8px_28px_rgba(255,255,255,.1)]"><Sparkles aria-hidden="true" size={15} /></span>form
      </Link>
      <Link href="/" className="focus-ring absolute right-5 top-6 z-10 flex items-center gap-2 rounded-lg text-xs font-semibold text-white/60 transition hover:text-white sm:right-8 sm:top-9"><ArrowLeft aria-hidden="true" size={14} />Home</Link>
      <div className="relative z-[1] w-full">{children}</div>
    </main>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto w-full max-w-[460px] rounded-[26px] border border-white/[.11] bg-[#15131c]/90 p-6 shadow-[inset_0_1px_rgba(255,255,255,.07),0_32px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:p-9">{children}</section>;
}
