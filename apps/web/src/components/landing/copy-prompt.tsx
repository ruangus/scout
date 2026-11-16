"use client"

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const layer = "col-start-1 row-start-1 transition-opacity duration-150 ease-out motion-reduce:transition-none"

export function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeout = setTimeout(() => setCopied(false), 1600)

    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <button
      type="button"
      aria-label={copied ? "Install prompt copied" : "Copy install prompt"}
      onClick={() => {
        void navigator.clipboard.writeText(prompt)
        setCopied(true)
      }}
      className="inline-flex h-11 items-center gap-2.5 rounded-full bg-primary pr-5 pl-4.5 text-[0.9375rem] font-medium text-primary-foreground transition-[transform,background-color] duration-150 ease-out-strong [-webkit-tap-highlight-color:transparent] hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] motion-reduce:transition-none"
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
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={1.5} />
        </motion.span>
      </AnimatePresence>
      <span aria-hidden="true" className="grid justify-items-start">
        <span className={cn(layer, copied ? "opacity-0" : "opacity-100")}>Copy install prompt</span>
        <span className={cn(layer, copied ? "opacity-100" : "opacity-0")}>Copied, paste it in</span>
      </span>
    </button>
  )
}
