import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("text-white", className)}
    >
      <rect x="20" y="20" width="60" height="60" rx="10" stroke="currentColor" strokeWidth="8"/>
      <path d="M40 50H60" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
}
