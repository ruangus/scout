"use client"

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { TextMorph } from "torph/react"

const duration = 250
const ease = [0.23, 1, 0.32, 1] as const

export function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  const reduceMotion = useReducedMotion()
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.25)", filter: "blur(4px)" }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)", filter: "blur(0px)" }

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
      className="inline-flex h-11 items-center gap-2.5 rounded-full bg-primary pr-5 pl-4.5 text-[0.9375rem] font-medium text-primary-foreground transition-transform duration-100 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] motion-reduce:transition-none"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={copied ? "check" : "copy"}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ duration: duration / 1000, ease }}
          className="grid place-items-center"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={1.5} className={copied ? "translate-x-[2.5px]" : undefined} />
        </motion.span>
      </AnimatePresence>
      <TextMorph duration={duration} ease={`cubic-bezier(${ease.join(", ")})`}>
        {copied ? "Copied, paste it in" : "Copy install prompt"}
      </TextMorph>
    </button>
  )
}
