import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, id, ...props }, ref,
) {
  return <label className="grid gap-2" htmlFor={id}>
    {label && <span className="text-sm font-semibold">{label}</span>}
    <input ref={ref} id={id} className={cn("focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-subtle transition-colors hover:border-violet/30", className)} {...props} />
    {hint && <span className="text-xs text-muted">{hint}</span>}
  </label>;
});
