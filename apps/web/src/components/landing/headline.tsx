"use client"

import { Cursor02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, MotionConfig } from "motion/react"
import { easeInOut, easeOut } from "@/hooks/use-timeline"
import { cn } from "@/lib/utils"

const mark = 0.25
const draw = 0.5

function Handle({ className }: { className: string }) {
  return <span className={cn("absolute size-[5px] border border-signal bg-background", className)} />
}

export function Headline() {
  return (
    <MotionConfig reducedMotion="user">
      <h1 className="animate-rise pb-6 text-[3.5rem] leading-[1.02] font-semibold tracking-[-0.04em] text-foreground lg:text-[4.25rem]">
        <span className="sr-only">Every answer has an address.</span>
        <span aria-hidden="true">
          Every answer
          <br />
          has an{" "}
          <span className="relative ml-[0.16em] inline-block">
            <motion.span
              initial={{ clipPath: "inset(-4px 105% -4px -4px)" }}
              animate={{ clipPath: "inset(-4px -2% -4px -4px)" }}
              transition={{ duration: draw, ease: easeInOut, delay: mark }}
              className="absolute -inset-x-[0.14em] top-[0.12em] -bottom-[0.04em] border border-signal/60 bg-signal/[0.07]"
            >
              <Handle className="-top-[3px] -left-[3px]" />
              <Handle className="-top-[3px] -right-[3px]" />
              <Handle className="-bottom-[3px] -left-[3px]" />
              <Handle className="-right-[3px] -bottom-[3px]" />
            </motion.span>
            <span className="relative inline-block pr-[0.04em] font-serif text-[1.14em] font-normal tracking-[-0.01em] italic">
              address<span className="text-signal">.</span>
            </span>
            <motion.span
              initial={{ transform: "translateX(-100%)" }}
              animate={{ transform: "translateX(0%)" }}
              transition={{ duration: draw, ease: easeInOut, delay: mark }}
              className="pointer-events-none absolute -inset-x-[0.14em] -bottom-[0.04em] h-0"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: easeOut, delay: mark - 0.05 }}
                className="absolute top-0 -right-3 flex items-start gap-0.5 tracking-normal"
              >
                <HugeiconsIcon icon={Cursor02Icon} size={20} strokeWidth={1.5} className="-translate-x-1 -translate-y-1 fill-signal text-signal" />
                <span className="mt-3.5 rounded-[4px] bg-signal px-1.5 py-0.5 font-mono text-[11px] leading-none font-medium text-signal-foreground">
                  agent
                </span>
              </motion.span>
            </motion.span>
          </span>
        </span>
      </h1>
    </MotionConfig>
  )
}
