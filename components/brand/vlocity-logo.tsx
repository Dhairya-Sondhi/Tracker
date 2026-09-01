import { cn } from "@/lib/utils";

export function VlocityMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 39H16L29 9H21L8 39Z" fill="currentColor" />
      <path d="M31 16H38V23H45V31H38V39H31V31H24V23H31V16Z" fill="currentColor" />
    </svg>
  );
}

export function VlocityBrand({ className, markClassName, wordmarkClassName }: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <VlocityMark className={cn("size-5", markClassName)} />
      <span className={cn("font-extrabold tracking-[-.035em]", wordmarkClassName)}>Vlocity</span>
    </span>
  );
}
