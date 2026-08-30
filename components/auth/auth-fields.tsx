"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
const inputClassName = "focus-ring min-h-[52px] w-full rounded-xl border border-white/[.11] bg-black/20 px-4 text-base text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-lavender/55 focus:bg-black/30 focus:ring-lavender/25 aria-[invalid=true]:border-negative/70 aria-[invalid=true]:focus:ring-negative/30";

export function AuthField({ label, error, className, ...props }: AuthFieldProps) {
  const id = useId(); const errorId = `${id}-error`;
  return <div><label htmlFor={id} className="block text-[13px] font-semibold text-white/80">{label}</label><input id={id} {...props} required aria-invalid={Boolean(error)} aria-describedby={error ? errorId : props["aria-describedby"]} className={cn(inputClassName, "mt-2", className)} />{error && <p id={errorId} className="mt-2 text-xs leading-5 text-[#e6a7b8]">{error}</p>}</div>;
}

export function PasswordField({ label, error, className, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false); const id = useId(); const errorId = `${id}-error`;
  return <div><label htmlFor={id} className="block text-[13px] font-semibold text-white/80">{label}</label><div className="relative mt-2"><input id={id} {...props} required minLength={8} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : props["aria-describedby"]} className={cn(inputClassName, "pr-14", className)} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible} className="focus-ring absolute inset-y-1 right-1 grid w-11 place-items-center rounded-lg text-white/55 transition hover:bg-white/[.06] hover:text-white">{visible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}</button></div>{error && <p id={errorId} className="mt-2 text-xs leading-5 text-[#e6a7b8]">{error}</p>}</div>;
}
