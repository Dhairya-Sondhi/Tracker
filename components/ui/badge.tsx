import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted", className)} {...props} />;
}
