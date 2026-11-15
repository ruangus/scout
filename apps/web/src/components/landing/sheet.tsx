"use client"

import { Cursor02Icon, GithubIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useAnimate, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { easeInOut, easeOut } from "@/hooks/use-timeline"
import { cn } from "@/lib/utils"

const github = "https://github.com/ruangus/scout"
const path = "~/scout/index.md"

type Line = {
  key: string
  kind: "title" | "lead" | "heading" | "text" | "command" | "blank"
  content?: ReactNode
  copy?: string
}

const link = "text-foreground underline decoration-foreground/25 decoration-1 underline-offset-[3px] hover:decoration-foreground/70"

const blank = (key: string): Line => ({ key, kind: "blank" })

const command = (key: string, run: string, note?: string): Line => ({
  key,
  kind: "command",
  copy: run,
  content: (
    <>
      <span className="text-foreground">
        <span className="text-muted-foreground/60 select-none">$ </span>
        {run}
      </span>
      {note === undefined ? null : <span className="font-sans text-sm text-muted-foreground"> {note}</span>}
    </>
  )
})

const lines: ReadonlyArray<Line> = [
  {
    key: "title",
    kind: "title",
    content: (
      <>
        Every answer has an{" "}
        <span className="font-serif text-[1.13em] leading-none font-normal tracking-[-0.01em] italic">
          address<span className="text-signal">.</span>
        </span>
      </>
    )
  },
  blank("b1"),
  {
    key: "lead",
    kind: "lead",
    content: "Your coding agent answers library questions from memory. scout hands it the real source, at the exact version you run."
  },
  blank("b2"),
  { key: "h-install", kind: "heading", content: "Install" },
  command("install", "bun add -g @ruangus/scout"),
  command("skill", "scout skill install"),
  { key: "requires", kind: "text", content: "Requires Bun 1.4 or newer. The skill tells your agent when to reach for scout, so you rarely run it yourself." },
  blank("b3"),
  { key: "h-how", kind: "heading", content: "How it works" },
  { key: "fetch", kind: "text", content: "Your agent hits a library question and fetches the repository at your branch, tag, or commit." },
  { key: "pinned", kind: "text", content: "The snapshot lands on disk. Tags and commits never move; branches update only when you ask." },
  { key: "cite", kind: "text", content: "The agent reads the files and answers with a file and a line." },
  blank("b4"),
  { key: "h-commands", kind: "heading", content: "Commands" },
  command("add", "scout add effect-ts/effect --tag effect@4.1.4"),
  command("list", "scout list"),
  command("update", "scout update effect-ts/effect"),
  command("remove", "scout remove effect-ts/effect"),
  blank("b5"),
  { key: "h-config", kind: "heading", content: "Configuration" },
  { key: "home", kind: "text", content: "Snapshots live in ~/.scout. Set SCOUT_HOME to keep them elsewhere." },
  { key: "token", kind: "text", content: "Set GITHUB_TOKEN to reach private repositories and raise GitHub's rate limit." },
  blank("b6"),
  {
    key: "colophon",
    kind: "text",
    content: (
      <>
        MIT licensed. Built by{" "}
        <a href="https://github.com/ruangus" className={link}>
          Ruan Gustavo
        </a>
        . Every option is in the{" "}
        <a href={`${github}#usage`} className={link}>
          readme
        </a>
        .
      </>
    )
  }
]

const questions = [
  { ask: "How do I install it?", line: "install", answer: "With Bun, globally. Then install the skill so your agent knows when to use it." },
  { ask: "Do tags ever change?", line: "pinned", answer: "No. A tag or commit stays exactly as fetched; only branches move, and only when you update." },
  { ask: "Where do snapshots live?", line: "home", answer: "In ~/.scout, or wherever SCOUT_HOME points." },
  { ask: "Private repos?", line: "token", answer: "Yes. Set GITHUB_TOKEN, which also raises the rate limit." }
]

const numberOf = (key: string) => lines.findIndex((line) => line.key === key) + 1

const style = {
  title: "text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-[3.5rem]",
  lead: "text-[1.0625rem] leading-7 text-pretty text-foreground",
  heading: "pt-1 text-sm leading-7 font-medium text-foreground",
  text: "text-[15px] leading-7 text-pretty text-muted-foreground",
  command: "font-mono text-[13px] leading-7",
  blank: "h-7"
}

function Handle({ className }: { className: string }) {
  return <span className={cn("absolute size-[5px] border border-signal bg-background", className)} />
}

function Selection() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute -inset-x-2 -inset-y-0.5">
      <motion.span
        initial={{ clipPath: "inset(0% 100% 100% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 0.5, ease: easeInOut }}
        className="absolute inset-0 border border-signal/60 bg-signal/[0.07]"
      />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, ease: easeOut, delay: 0.5 }} className="absolute inset-0">
        <Handle className="-top-[2px] -left-[2px]" />
        <Handle className="-top-[2px] -right-[2px]" />
        <Handle className="-bottom-[2px] -left-[2px]" />
        <Handle className="-right-[2px] -bottom-[2px]" />
      </motion.span>
    </span>
  )
}

function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" className="size-6 shrink-0">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" className="fill-card stroke-white/10" />
      <g className="stroke-signal" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 17.6C8 14.6 10.4 14.5 12 16.3S15.9 18.3 17.4 15.3" />
        <path d="M20 23.5L25.5 8.5" />
      </g>
    </svg>
  )
}

export function Sheet() {
  const reduce = useReducedMotion() ?? false
  const [root, animate] = useAnimate<HTMLDivElement>()
  const cursor = useRef<HTMLDivElement>(null)
  const boxes = useRef(new Map<number, HTMLDivElement>())
  const run = useRef(0)
  const placed = useRef(false)
  const [hovered, setHovered] = useState<number>()
  const [cited, setCited] = useState<number>()
  const [asking, setAsking] = useState<string>()
  const [answer, setAnswer] = useState<(typeof questions)[number]>()
  const [copied, setCopied] = useState<number>()

  useEffect(() => {
    const match = /^#L(\d+)$/.exec(window.location.hash)

    if (match !== null) setCited(Number(match[1]))
  }, [])

  useEffect(() => {
    if (copied === undefined) return

    const timeout = setTimeout(() => setCopied(undefined), 1600)

    return () => clearTimeout(timeout)
  }, [copied])

  const pin = (number: number) => {
    run.current += 1
    setAnswer(undefined)
    setAsking(undefined)
    setCited(number)
    window.history.replaceState(null, "", `#L${number}`)
  }

  const ask = async (question: (typeof questions)[number], origin: DOMRect) => {
    const number = numberOf(question.line)
    const box = boxes.current.get(number)
    const pointer = cursor.current
    const sheet = root.current

    if (box === undefined || pointer === null || sheet === null) return

    run.current += 1

    const current = run.current
    const frame = sheet.getBoundingClientRect()
    const target = box.getBoundingClientRect()
    const start = { x: target.left - frame.left - 8, y: target.top - frame.top - 2 }
    const finish = { x: target.right - frame.left + 8, y: target.bottom - frame.top + 2 }

    setAsking(question.ask)
    setAnswer(undefined)
    setCited(undefined)
    box.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })

    if (!placed.current) {
      placed.current = true
      await animate(pointer, { x: origin.left - frame.left, y: origin.top - frame.top, opacity: 0 }, { duration: 0 })
    }

    await animate(pointer, { ...start, opacity: 1 }, { duration: reduce ? 0 : 0.6, ease: easeInOut })

    if (run.current !== current) return

    setCited(number)
    window.history.replaceState(null, "", `#L${number}`)
    await animate(pointer, finish, { duration: reduce ? 0 : 0.5, ease: easeInOut })

    if (run.current !== current) return

    setAnswer(question)
  }

  const shown = hovered ?? cited ?? 1

  return (
    <main className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-full max-w-[52rem] items-center gap-3 px-4 sm:px-6">
          <Mark />
          <p className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-muted-foreground">
            {path}
            <span className="text-signal tabular-nums">:{shown}</span>
          </p>
          <a href={github} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
            <HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={1.5} aria-hidden="true" />
            GitHub
          </a>
        </div>
      </header>

      <div ref={root} className="animate-rise relative mx-auto w-full max-w-[52rem] flex-1 px-4 pt-10 pb-56 sm:px-6 sm:pt-16" onMouseLeave={() => setHovered(undefined)}>
        {lines.map((line, index) => {
          const number = index + 1
          const selected = cited === number

          return (
            <div
              key={line.key}
              id={`L${number}`}
              onMouseEnter={() => setHovered(number)}
              className="group/line grid scroll-mt-20 grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-x-4 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-6"
            >
              <button
                type="button"
                aria-label={`Link to line ${number}`}
                onClick={() => pin(number)}
                className={cn(
                  "text-right font-mono text-xs leading-7 tabular-nums outline-none focus-visible:text-foreground",
                  selected ? "text-signal" : "text-muted-foreground/35 group-hover/line:text-foreground"
                )}
              >
                {number}
              </button>
              <div className="min-w-0">
                <div
                  ref={(element) => {
                    if (element === null) boxes.current.delete(number)
                    else boxes.current.set(number, element)
                  }}
                  className={cn("relative w-fit max-w-full", style[line.kind])}
                >
                  {selected ? <Selection key={`${number}-${asking ?? "pin"}`} /> : null}
                  {line.kind === "title" ? (
                    <h1 className="relative">{line.content}</h1>
                  ) : line.kind === "heading" ? (
                    <h2 className="relative">{line.content}</h2>
                  ) : line.copy !== undefined ? (
                    <button
                      type="button"
                      aria-label={`Copy ${line.copy}`}
                      onClick={() => {
                        void navigator.clipboard.writeText(line.copy ?? "")
                        setCopied(number)
                      }}
                      className="relative max-w-full truncate text-left outline-none focus-visible:underline"
                    >
                      {line.content}
                      <span aria-live="polite" className={cn("pl-4 font-sans text-xs", copied === number ? "text-signal" : "text-muted-foreground/60 opacity-0 group-hover/line:opacity-100")}>
                        {copied === number ? "copied" : "copy"}
                      </span>
                    </button>
                  ) : (
                    <p className="relative">{line.content}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={cursor} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-10 flex items-start gap-0.5 opacity-0">
          <span className="relative size-5 shrink-0 -translate-x-1 -translate-y-1">
            <HugeiconsIcon icon={Cursor02Icon} size={20} strokeWidth={3.5} className="absolute inset-0 fill-white text-white" />
            <HugeiconsIcon icon={Cursor02Icon} size={20} strokeWidth={1.5} className="relative fill-signal text-signal" />
          </span>
          <span className="mt-3.5 rounded-[4px] bg-signal px-1.5 py-0.5 font-mono text-[11px] leading-none font-medium text-signal-foreground">agent</span>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3 sm:pb-5">
        <div className="pointer-events-auto w-full max-w-[36rem] rounded-2xl border border-border bg-card/90 p-2 shadow-[0_18px_50px_-18px_oklch(0_0_0/0.8)] backdrop-blur-md">
          <div className="flex min-h-9 items-baseline gap-3 px-2 pt-1 pb-2 text-sm leading-6">
            {answer === undefined ? (
              <p className="text-muted-foreground">{asking === undefined ? "Ask this page something. The agent answers with the line it read." : "Reading…"}</p>
            ) : (
              <p key={answer.ask} className="animate-rise text-pretty text-foreground">
                {answer.answer}{" "}
                <a href={`#L${numberOf(answer.line)}`} className="font-mono text-[12.5px] whitespace-nowrap text-signal tabular-nums hover:underline">
                  index.md:{numberOf(answer.line)}
                </a>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((question) => (
              <button
                key={question.ask}
                type="button"
                onClick={(event) => void ask(question, event.currentTarget.getBoundingClientRect())}
                className={cn(
                  "h-8 rounded-md px-2.5 text-[13px] outline-none transition-transform duration-100 ease-out [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-signal/70 active:scale-[0.97] motion-reduce:transition-none",
                  asking === question.ask ? "bg-foreground/[0.12] text-foreground" : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.09] hover:text-foreground"
                )}
              >
                {question.ask}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
