import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props }, ref,
) {
  return <button ref={ref} type={type} className={cn(
    "focus-ring inline-flex items-center justify-center gap-2 rounded-[0.8rem] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
    variant === "primary" && "bg-ink text-canvas hover:opacity-85",
    variant === "secondary" && "border border-line bg-surface-raised text-ink hover:bg-surface shadow-sm",
    variant === "ghost" && "text-muted hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5",
    size === "sm" && "h-9 px-3.5 text-xs",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-13 px-6 text-sm",
    size === "icon" && "size-10",
    className,
  )} {...props} />;
});
