"use client"

import { FileCode2 } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { question, sha, sourceExcerpt, sourceFile, sourceLine } from "./demo-content"
import { Highlight } from "./highlight"
import { easeInOut, easeOut, typed, useTimeline } from "@/hooks/use-timeline"

const segments = [
  { text: "~/.scout", label: "cache" },
  { text: "github.com", label: "host" },
  { text: "effect-ts", label: "owner" },
  { text: "effect", label: "repository" },
  { text: "tag", label: "selection" },
  { text: "effect%404.1.4", label: "ref" },
  { text: sha.slice(0, 7), label: "revision" }
]

const tree = [
  { name: "README.md", depth: 0, onPath: false },
  { name: "packages", depth: 0, onPath: true },
  { name: "ai", depth: 1, onPath: false },
  { name: "effect", depth: 1, onPath: true },
  { name: "src", depth: 2, onPath: true },
  { name: "Effect.ts", depth: 3, onPath: true },
  { name: "Schedule.ts", depth: 3, onPath: false }
]

const walk = tree.flatMap((row, index) => (row.onPath ? [index] : []))

const at = {
  question: 200,
  segments: 1600,
  segmentGap: 220,
  tree: 3400,
  walk: 3900,
  walkGap: 300,
  open: 5200,
  highlight: 5900,
  answer: 6500,
  citation: 6900
}

const lead = 600
const end = 7600
const rowHeight = 26

const status = (time: number) => {
  if (time >= at.answer) return "answered"

  if (time >= at.open) return "reading Effect.ts"

  if (time >= at.tree) return "walking the snapshot"

  if (time >= at.segments) return "resolving the path"

  return "thinking"
}

function Caret({ on }: { on: boolean }) {
  return on ? <span className="ml-px inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] animate-blink bg-signal/80" /> : null
}

const enter = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.3, ease: easeOut }
}

export function PathDemo() {
  const { time: clock } = useTimeline(lead + end)
  const time = clock - lead
  const prompt = typed(question, time, at.question, 28)
  const walked = walk.filter((_, step) => time >= at.walk + step * at.walkGap)
  const cursor = walked.at(-1)
  const opened = time >= at.open

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-[2px]">
      <div className="flex items-center justify-between border-b border-border px-5 py-2.5 font-mono text-xs">
        <span className="text-muted-foreground">agent session</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 transition-colors duration-300 ease-out-strong",
            time >= at.answer ? "bg-signal/15 text-signal" : "bg-secondary text-muted-foreground"
          )}
        >
          {status(time)}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-7">
        <p className="flex items-center gap-3 font-mono text-sm text-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">you</span>
          <span>
            {prompt.text}
            <Caret on={prompt.typing} />
          </span>
        </p>

        <div className="overflow-x-auto">
          <div className="flex w-max items-start font-mono text-lg sm:text-xl">
            {segments.map((segment, index) => {
              const shown = time >= at.segments + index * at.segmentGap

              return (
                <div key={segment.label} className="flex items-start">
                  {index > 0 ? (
                    <span className={cn("px-1.5 text-foreground/25 transition-opacity duration-200", shown ? "opacity-100" : "opacity-0")}>/</span>
                  ) : null}
                  <div className="relative flex flex-col items-center pb-7">
                    <motion.span
                      initial={false}
                      animate={shown ? { opacity: 1, transform: "translateX(0px)" } : { opacity: 0, transform: "translateX(-6px)" }}
                      transition={{ duration: 0.25, ease: easeOut }}
                      className={index === segments.length - 1 ? "text-signal" : "text-foreground"}
                    >
                      {segment.text}
                    </motion.span>
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ clipPath: shown ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
                      transition={{ duration: 0.3, ease: easeInOut, delay: 0.08 }}
                      className="absolute top-full mt-[-26px] h-2.5 w-px bg-foreground/25"
                    />
                    <motion.span
                      initial={false}
                      animate={{ opacity: shown ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: easeOut, delay: 0.12 }}
                      className="absolute top-full mt-[-13px] text-[10px] tracking-widest whitespace-nowrap text-muted-foreground uppercase"
                    >
                      {segment.label}
                    </motion.span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[190px_1fr]">
          <div className="relative font-mono text-[13px]">
            {cursor !== undefined ? (
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 rounded-md bg-signal/10"
                style={{ height: rowHeight }}
                initial={false}
                animate={{ transform: `translateY(${cursor * rowHeight}px)` }}
                transition={{ duration: 0.3, ease: easeInOut }}
              />
            ) : null}
            {tree.map((row, index) =>
              time >= at.tree + index * 50 ? (
                <motion.div
                  key={row.name}
                  {...enter}
                  className={cn(
                    "relative flex items-center transition-colors duration-200",
                    walked.includes(index) ? "text-foreground" : "text-foreground/35"
                  )}
                  style={{ height: rowHeight, paddingLeft: 10 + row.depth * 14 }}
                >
                  {row.name}
                  {row.name.includes(".") ? null : <span className="text-foreground/30">/</span>}
                </motion.div>
              ) : null
            )}
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: time >= at.tree ? 1 : 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="min-w-0 rounded-xl border border-border bg-background/70"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-xs">
              <FileCode2 className="size-3.5 text-muted-foreground" />
              <motion.span
                key={opened ? "file" : "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className={opened ? "text-foreground/80" : "text-muted-foreground"}
              >
                {opened ? sourceFile : "no file open"}
              </motion.span>
            </div>
            <ol className="min-h-[134px] px-2 py-2.5 font-mono text-[12.5px] leading-6">
              {opened
                ? sourceExcerpt.map((line, index) => (
                    <motion.li
                      key={line}
                      initial={{ opacity: 0, transform: "translateY(4px)" }}
                      animate={{ opacity: 1, transform: "translateY(0px)" }}
                      transition={{ duration: 0.25, ease: easeOut, delay: index * 0.04 }}
                      className={cn(
                        "flex gap-4 rounded px-2 transition-colors duration-300 ease-out-strong",
                        time >= at.highlight && index === 1 ? "bg-signal/10" : "bg-transparent"
                      )}
                    >
                      <span className="w-9 shrink-0 text-right text-foreground/30 select-none">{sourceLine + index}</span>
                      <span className="min-w-0 truncate whitespace-pre">
                        <Highlight code={line} />
                      </span>
                    </motion.li>
                  ))
                : null}
            </ol>
          </motion.div>
        </div>

        <div className="flex min-h-7 flex-wrap items-center gap-3 border-t border-border pt-4">
          {time >= at.answer ? (
            <motion.code {...enter} className="font-mono text-sm">
              <Highlight code="task.pipe(Effect.retry({ times: 3 }))" emphasis="retry" />
            </motion.code>
          ) : null}
          {time >= at.citation ? (
            <motion.span
              {...enter}
              className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/5 px-2.5 py-0.5 font-mono text-[11px] text-signal"
            >
              <FileCode2 className="size-3" />
              read from Effect.ts:{sourceLine + 1}
            </motion.span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
