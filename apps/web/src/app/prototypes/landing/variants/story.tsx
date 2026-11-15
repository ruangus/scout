"use client"

import { BookOpenCheck, FileCode2, GitBranch, RotateCcw } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  addCommand,
  install,
  question,
  repository,
  sha,
  snapshotPath,
  sourceExcerpt,
  sourceFile,
  sourceLine,
  tag
} from "../content"
import { CopyCommand } from "../copy-command"

const easeOut = [0.23, 1, 0.32, 1] as const
const easeInOut = [0.77, 0, 0.175, 1] as const

const chapters = [
  { label: "Ask", start: 0 },
  { label: "Fetch", start: 2600 },
  { label: "Read", start: 6200 },
  { label: "Answer", start: 9400 }
] as const

const end = 12800

const at = {
  question: 300,
  addCommand: 2800,
  downloaded: 4100,
  toSnapshot: 4300,
  snapshotRows: 4900,
  readCommand: 6300,
  toSource: 6600,
  sourceLines: 7200,
  highlight: 8100,
  toAgent: 9400,
  answer: 9600,
  answerCode: 10900,
  citation: 11400
}

type Panel = "agent" | "snapshot" | "source"

const focusAt = (time: number): Panel => {
  if (time >= at.toAgent) return "agent"

  if (time >= at.toSource) return "source"

  if (time >= at.toSnapshot) return "snapshot"

  return "agent"
}

const typed = (text: string, time: number, start: number, speed: number) => {
  const count = Math.max(0, Math.min(text.length, Math.floor((time - start) / speed)))

  return { text: text.slice(0, count), typing: count > 0 && count < text.length }
}

function useTimeline() {
  const reduce = useReducedMotion()
  const [time, setTime] = useState(0)
  const origin = useRef(0)

  const restartAt = useCallback((offset: number) => {
    origin.current = performance.now() - offset
    setTime(offset)
  }, [])

  useEffect(() => {
    if (reduce) {
      setTime(end)

      return
    }

    origin.current = performance.now()

    let frame = 0

    const tick = () => {
      const elapsed = performance.now() - origin.current

      setTime(Math.min(elapsed, end))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [reduce])

  return { time, restartAt, reduce: reduce ?? false }
}

function Caret({ on }: { on: boolean }) {
  return on ? <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-signal/80 animate-blink" /> : null
}

const rise = {
  initial: { opacity: 0, transform: "translateY(4px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.3, ease: easeOut }
}

function Appear({ when, children, className }: { when: boolean; children: ReactNode; className?: string }) {
  if (!when) return null

  return (
    <motion.div {...rise} className={className}>
      {children}
    </motion.div>
  )
}

function Window({
  title,
  path,
  active,
  className,
  children
}: {
  title: string
  path: string
  active: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card/70 transition-[opacity,border-color] duration-500 ease-in-out-strong",
        active ? "border-signal/30 opacity-100" : "border-border opacity-45",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 font-mono text-xs text-muted-foreground">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-foreground/15" />
          <span className="size-2 rounded-full bg-foreground/15" />
          <span className="size-2 rounded-full bg-foreground/15" />
        </span>
        <span className="flex-1 text-center text-foreground/80">{title}</span>
        <span>{path}</span>
      </div>
      <div className="px-4 py-3.5 font-mono text-[13px] leading-6">{children}</div>
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  const reduce = useReducedMotion()

  return (
    <div className="relative mx-auto h-8 w-px bg-border" aria-hidden="true">
      <motion.span
        className="absolute -left-[3px] size-[7px] rounded-full bg-signal"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          transform: active || reduce ? "translateY(26px)" : "translateY(0px)"
        }}
        transition={{ duration: reduce ? 0 : 0.6, ease: easeInOut }}
      />
    </div>
  )
}

function Demo() {
  const { time, restartAt, reduce } = useTimeline()
  const focus = focusAt(time)
  const chapter = chapters.findLastIndex((entry) => time >= entry.start)

  const prompt = typed(question, time, at.question, 30)
  const command = typed(addCommand, time, at.addCommand, 16)
  const answer = typed("Pass { times: 3 } straight to Effect.retry:", time, at.answer, 24)

  return (
    <div className="w-full min-w-0">
      <div className="mb-5 grid grid-cols-4 gap-2">
        {chapters.map((entry, index) => {
          const next = chapters[index + 1]?.start ?? end
          const progress = Math.max(0, Math.min(1, (time - entry.start) / (next - entry.start)))

          return (
            <button
              key={entry.label}
              type="button"
              onClick={() => restartAt(entry.start)}
              className="group text-left"
              aria-label={`Jump to ${entry.label}`}
            >
              <span className="block h-0.5 overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="block h-full origin-left bg-signal"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
              <span
                className={cn(
                  "mt-2 block font-mono text-[11px] tracking-wide uppercase transition-colors duration-200 ease-out-strong",
                  index === chapter ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {String(index + 1).padStart(2, "0")} {entry.label}
              </span>
            </button>
          )
        })}
      </div>

      <Window title="Claude Code" path="~/app" active={focus === "agent"}>
        <p className="text-foreground">
          <span className="mr-2 text-muted-foreground">›</span>
          {prompt.text}
          <Caret on={prompt.typing} />
        </p>
        <Appear when={time >= at.addCommand} className="mt-1 text-muted-foreground">
          <span className="text-signal">scout</span> {command.text.replace(/^scout /, "")}
          <Caret on={command.typing} />
        </Appear>
        <Appear when={time >= at.downloaded} className="text-muted-foreground">
          <span className="text-foreground/40">↳</span> Downloaded {repository} @ {tag}
        </Appear>
        <Appear when={time >= at.readCommand} className="text-muted-foreground">
          <span className="text-signal">read</span> {sourceFile}:{sourceLine}
        </Appear>
        <Appear when={time >= at.answer} className="mt-3 border-t border-border pt-3 font-sans text-sm text-foreground">
          {answer.text}
          <Caret on={answer.typing} />
        </Appear>
        <Appear when={time >= at.answerCode} className="mt-2 rounded-md bg-secondary/60 px-3 py-2 text-foreground">
          task.pipe(Effect.<span className="text-signal">retry</span>({"{ times: 3 }"}))
        </Appear>
        <Appear when={time >= at.citation} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-signal/30 px-2.5 py-0.5 text-[11px] text-signal">
          <FileCode2 className="size-3" /> Effect.ts:{sourceLine} · {tag}
        </Appear>
      </Window>

      <Connector active={time >= at.toSnapshot} />

      <Window title="Snapshot" path="~/.scout" active={focus === "snapshot"} className="mx-6">
        <dl className="grid grid-cols-[88px_1fr] gap-x-3 text-muted-foreground">
          {[
            ["repository", repository],
            ["selection", `tag ${tag}`],
            ["sha", sha.slice(0, 12)],
            ["path", snapshotPath]
          ].map(([key, value], index) =>
            time >= at.snapshotRows + index * 80 ? (
              <motion.div key={key} {...rise} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-foreground/40">{key}</dt>
                <dd className="truncate text-foreground">{value}</dd>
              </motion.div>
            ) : null
          )}
        </dl>
      </Window>

      <Connector active={time >= at.toSource} />

      <Window title={`${sourceFile.split("/").at(-1)}`} path={`${tag}`} active={focus === "source"}>
        <ol className="text-[12.5px]">
          {sourceExcerpt.map((line, index) =>
            time >= at.sourceLines + index * 80 ? (
              <motion.li
                key={line}
                {...rise}
                className={cn(
                  "-mx-2 flex gap-4 rounded px-2 transition-colors duration-300 ease-out-strong",
                  time >= at.highlight && index >= 1 && index <= 3 ? "bg-signal/10" : "bg-transparent"
                )}
              >
                <span className="w-9 shrink-0 text-right text-foreground/30 select-none">{sourceLine + index}</span>
                <span className="min-w-0 truncate whitespace-pre text-foreground/85">{line}</span>
              </motion.li>
            ) : null
          )}
        </ol>
      </Window>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => restartAt(0)}
          disabled={reduce}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-sm text-muted-foreground transition-[color,transform] duration-150 ease-out-strong active:scale-[0.97] disabled:opacity-40 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
        >
          <RotateCcw className="size-3.5" /> Replay
        </button>
      </div>
    </div>
  )
}

const intro = {
  hidden: { opacity: 0, transform: "translateY(8px)" },
  shown: { opacity: 1, transform: "translateY(0px)" }
}

export function Story() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(oklch(1_0_0/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_60%_40%,black,transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <motion.div
          initial="hidden"
          animate="shown"
          transition={{ staggerChildren: 0.06 }}
          className="min-w-0 max-w-xl"
        >
          <motion.div variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="flex items-center gap-2.5">
            <span className="grid size-5 grid-cols-2 gap-0.5" aria-hidden="true">
              <span className="rounded-[2px] bg-signal" />
              <span className="rounded-[2px] bg-foreground/80" />
              <span className="rounded-[2px] bg-foreground/80" />
              <span className="rounded-[2px] bg-foreground/20" />
            </span>
            <span className="font-mono text-base text-foreground">scout</span>
          </motion.div>

          <motion.p variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="mt-10 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            CLI · for coding agents
          </motion.p>

          <motion.h1 variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="mt-4 font-pixel text-[2.6rem] leading-[1.05] text-foreground sm:text-5xl">
            Your agent guesses.
            <span className="block text-signal">scout reads the source.</span>
          </motion.h1>

          <motion.p variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="mt-6 text-lg leading-relaxed text-muted-foreground">
            scout gives your coding agent a read-only copy of any GitHub repository, pinned to the branch, tag, or commit you actually run.
          </motion.p>

          <motion.ul variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="mt-6 space-y-2.5 text-[15px] text-foreground/85">
            <li className="flex items-center gap-3"><GitBranch className="size-4 text-signal" /> Pinned to the version you depend on</li>
            <li className="flex items-center gap-3"><FileCode2 className="size-4 text-muted-foreground" /> Real source, no install or build</li>
            <li className="flex items-center gap-3"><BookOpenCheck className="size-4 text-muted-foreground" /> Taught to your agent with one skill</li>
          </motion.ul>

          <motion.div variants={intro} transition={{ duration: 0.3, ease: easeOut }} className="mt-9 max-w-md">
            <CopyCommand command={install} />
            <p className="mt-3 text-sm text-muted-foreground">
              Then run <code className="font-mono text-foreground">scout skill install</code> ·{" "}
              <a href="https://github.com/ruangus/scout" className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-foreground">
                GitHub
              </a>
            </p>
          </motion.div>
        </motion.div>

        <Demo />
      </div>
    </main>
  )
}
