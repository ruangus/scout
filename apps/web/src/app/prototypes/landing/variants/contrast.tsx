"use client"

import { Check, FileCode2, X } from "lucide-react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { install, memoryAnswer, question, scoutAnswer, sourceFile, sourceLine, tag } from "../content"
import { CopyCommand } from "../copy-command"

const easeOut = [0.23, 1, 0.32, 1] as const
const easeInOut = [0.77, 0, 0.175, 1] as const

const modes = ["From memory", "With scout"] as const

type Mode = (typeof modes)[number]

const installs = [
  { label: "CLI", command: install },
  { label: "Skill", command: "scout skill install" }
] as const

function GridLines() {
  const reduce = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto max-w-6xl">
      {[0, 100 / 3, 200 / 3, 100].map((left) => (
        <motion.span
          key={left}
          className={cn("absolute top-0 bottom-0 w-px", left === 0 || left === 100 ? "bg-border" : "bg-border/50")}
          style={{ left: `${left}%` }}
          initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.6, ease: easeInOut, delay: left / 400 }}
        />
      ))}
    </div>
  )
}

function InstallTabs() {
  const [active, setActive] = useState(0)
  const current = installs[active] ?? installs[0]

  return (
    <div className="mx-auto w-full max-w-lg text-left">
      <div className="relative mb-2 inline-flex rounded-lg border border-border p-0.5 font-mono text-xs">
        {installs.map((entry, index) => (
          <button
            key={entry.label}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative z-10 rounded-md px-3 py-1 transition-colors duration-200 ease-out-strong",
              index === active ? "text-foreground" : "text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
            )}
          >
            {index === active ? (
              <motion.span
                layoutId="install-tab"
                className="absolute inset-0 -z-10 rounded-md bg-secondary"
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              />
            ) : null}
            {entry.label}
          </button>
        ))}
      </div>
      <CopyCommand command={current.command} />
    </div>
  )
}

function Answer({ mode }: { mode: Mode }) {
  const answer = mode === "With scout" ? scoutAnswer : memoryAnswer
  const grounded = mode === "With scout"

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, transform: "translateY(6px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{ opacity: 0, transform: "translateY(-6px)" }}
      transition={{ duration: 0.2, ease: easeOut }}
      className="space-y-4"
    >
      {grounded ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/5 px-3 py-1 font-mono text-xs text-signal">
          <FileCode2 className="size-3.5" />
          read {sourceFile}:{sourceLine} @ {tag}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
          answered from training data · no source read
        </div>
      )}
      <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 px-4 py-3.5 font-mono text-[13px] leading-6 text-foreground/90">
        {answer.code}
      </pre>
      <p className={cn("flex items-start gap-2 text-sm", grounded ? "text-foreground/85" : "text-muted-foreground")}>
        {grounded ? <Check className="mt-0.5 size-4 shrink-0 text-signal" /> : <X className="mt-0.5 size-4 shrink-0 text-destructive" />}
        {answer.note}
      </p>
    </motion.div>
  )
}

function Comparison() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const [mode, setMode] = useState<Mode>("From memory")
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!inView || touched) return

    const timeout = setTimeout(() => setMode("With scout"), 2200)

    return () => clearTimeout(timeout)
  }, [inView, touched])

  return (
    <div ref={ref} className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">// same agent, same question</p>
        <div className="relative inline-flex rounded-lg border border-border p-0.5 text-sm" role="tablist">
          {modes.map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={entry === mode}
              onClick={() => {
                setTouched(true)
                setMode(entry)
              }}
              className={cn(
                "relative z-10 rounded-md px-3.5 py-1.5 transition-colors duration-200 ease-out-strong",
                entry === mode ? "text-foreground" : "text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
              )}
            >
              {entry === mode ? (
                <motion.span
                  layoutId="answer-mode"
                  className={cn("absolute inset-0 -z-10 rounded-md", entry === "With scout" ? "bg-signal/15" : "bg-secondary")}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                />
              ) : null}
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs text-muted-foreground">you</span>
        <p className="pt-1 text-foreground">{question}</p>
      </div>

      <div className="mt-6 min-h-[236px] pl-10">
        <AnimatePresence mode="wait" initial={false}>
          <Answer key={mode} mode={mode} />
        </AnimatePresence>
      </div>
    </div>
  )
}

const pillars = [
  ["// pinned", "The branch, tag, or commit you run", "Every snapshot lives at its own path. A tag stays the tag you asked for."],
  ["// real source", "Files, not summaries", "Your agent searches and reads the repository itself. Nothing to install or build."],
  ["// one skill", "Your agent knows when", "scout skill install teaches Claude Code and friends to reach for scout on their own."]
] as const

export function Contrast() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <GridLines />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between border-b border-border px-6 py-4">
        <span className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <span className="size-2.5 rounded-full bg-signal" aria-hidden="true" />
          scout
        </span>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="transition-colors duration-150 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground">How it works</a>
          <a href="https://github.com/ruangus/scout" className="transition-colors duration-150 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground">GitHub</a>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl border-b border-border px-6 pt-20 pb-16 text-center sm:pt-28">
        <motion.div
          initial="hidden"
          animate="shown"
          transition={{ staggerChildren: 0.06 }}
        >
          <motion.p
            variants={{ hidden: { opacity: 0, transform: "translateY(8px)" }, shown: { opacity: 1, transform: "translateY(0px)" } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            // v0.1 · read-only snapshots for coding agents
          </motion.p>
          <motion.h1
            variants={{ hidden: { opacity: 0, transform: "translateY(8px)" }, shown: { opacity: 1, transform: "translateY(0px)" } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="mx-auto mt-5 max-w-3xl text-5xl leading-[1.04] font-semibold tracking-tight text-balance text-foreground sm:text-6xl"
          >
            Stop letting your agent answer from memory.
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, transform: "translateY(8px)" }, shown: { opacity: 1, transform: "translateY(0px)" } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            scout puts the real source of any GitHub repository on disk, at the exact version you depend on, so your agent can read it before it answers.
          </motion.p>
          <motion.div
            variants={{ hidden: { opacity: 0, transform: "translateY(8px)" }, shown: { opacity: 1, transform: "translateY(0px)" } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="mt-10"
          >
            <InstallTabs />
          </motion.div>
        </motion.div>
      </section>

      <section id="how" className="relative mx-auto max-w-6xl border-b border-border px-6 py-16">
        <Comparison />
      </section>

      <section className="relative mx-auto grid max-w-6xl sm:grid-cols-3">
        {pillars.map(([label, title, body], index) => (
          <div key={label} className={cn("px-6 py-12", index > 0 && "sm:border-l sm:border-border")}>
            <p className="font-mono text-xs text-signal">{label}</p>
            <h2 className="mt-3 text-lg font-medium text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <div className="h-24" />
    </main>
  )
}
