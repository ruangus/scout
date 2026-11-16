import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-mono text-[15px] text-foreground", className)}>
      <span className="text-muted-foreground">~/</span>scout
    </span>
  )
}
