"use client"

import { Cursor02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, MotionConfig } from "motion/react"
import { easeInOut, easeOut } from "@/hooks/use-timeline"
import { cn } from "@/lib/utils"

const mark = 0.25
const draw = 0.5
const box = "-inset-x-[0.14em] top-[0.12em] -bottom-[0.04em]"

function Handle({ className }: { className: string }) {
  return <span className={cn("absolute size-[5px] border border-signal bg-background", className)} />
}

export function Headline() {
  return (
    <MotionConfig reducedMotion="user">
      <h1 className="animate-rise pb-6 text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.04em] text-foreground sm:text-[3.5rem] lg:text-[4.25rem]">
        <span className="sr-only">Every answer has an address.</span>
        <span aria-hidden="true">
          Every answer
          <br />
          has an{" "}
          <span className="relative ml-[0.16em] inline-block">
            <motion.span
              initial={{ clipPath: "inset(0% 100% 100% 0%)" }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              transition={{ duration: draw, ease: easeInOut, delay: mark }}
              className={cn("absolute", box)}
            >
              <span className="absolute inset-0 border-t border-l border-signal/60 bg-signal/[0.07]" />
              <motion.span
                initial={{ transform: "translate(-100%, -100%)" }}
                animate={{ transform: "translate(0%, 0%)" }}
                transition={{ duration: draw, ease: easeInOut, delay: mark }}
                className="absolute inset-0 border-r border-b border-signal/60"
              />
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: easeOut, delay: mark + draw }}
              className={cn("absolute", box)}
            >
              <Handle className="-top-[2px] -left-[2px]" />
              <Handle className="-top-[2px] -right-[2px]" />
              <Handle className="-bottom-[2px] -left-[2px]" />
              <Handle className="-right-[2px] -bottom-[2px]" />
            </motion.span>
            <span className="relative inline-block pr-[0.04em] font-serif text-[1.14em] font-normal tracking-[-0.01em] italic">
              address<span className="text-signal">.</span>
            </span>
            <motion.span
              initial={{ transform: "translate(-100%, -100%)" }}
              animate={{ transform: "translate(0%, 0%)" }}
              transition={{ duration: draw, ease: easeInOut, delay: mark }}
              className={cn("pointer-events-none absolute", box)}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: easeOut, delay: mark - 0.05 }}
                className="absolute top-full left-full flex items-start gap-0.5 tracking-normal"
              >
                <span className="relative size-5 shrink-0 -translate-x-1 -translate-y-1">
                  <HugeiconsIcon icon={Cursor02Icon} size={20} strokeWidth={3.5} className="absolute inset-0 fill-white text-white" />
                  <HugeiconsIcon icon={Cursor02Icon} size={20} strokeWidth={1.5} className="relative fill-signal text-signal" />
                </span>
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
