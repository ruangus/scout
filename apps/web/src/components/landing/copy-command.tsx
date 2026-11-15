"use client"

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
    <div className={cn("flex h-12 items-center gap-3 pr-2 pl-4 font-mono text-[0.8125rem]", className)}>
      <span className="text-muted-foreground select-none">$</span>
      <span className="flex-1 truncate">{command}</span>
      <button
        type="button"
        aria-label={copied ? "Copied" : `Copy ${command}`}
        onClick={() => {
          void navigator.clipboard.writeText(command)
          setCopied(true)
        }}
        className="grid size-8 place-items-center rounded-md text-muted-foreground transition-transform duration-100 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-secondary hover:text-foreground active:scale-[0.97] motion-reduce:transition-none"
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
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={1.5} className={copied ? "text-foreground" : undefined} />
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
