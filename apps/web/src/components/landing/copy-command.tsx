"use client"

import { Check, Copy } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeout = setTimeout(() => setCopied(false), 1600)

    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg border border-border bg-card/60 pr-1.5 pl-4 font-mono text-sm",
        className
      )}
    >
      <span className="text-muted-foreground select-none">$</span>
      <span className="flex-1 truncate text-foreground">{command}</span>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy command"}
        onClick={() => {
          void navigator.clipboard.writeText(command)
          setCopied(true)
        }}
        className="relative grid size-8 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? "check" : "copy"}
            initial={{ opacity: 0, transform: "scale(0.8)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.8)" }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="grid place-items-center"
          >
            {copied ? <Check className="size-4 text-signal" /> : <Copy className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
