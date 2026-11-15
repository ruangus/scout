"use client"

import { motion, useReducedMotion } from "motion/react"
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { addCommand, install, repository, sha, tag } from "../content"
import { CopyCommand } from "../copy-command"

const easeOut = [0.23, 1, 0.32, 1] as const

const snapshotFields = [
  `"repository": { "owner": "effect-ts", "name": "effect" },`,
  `"selection": { "_tag": "Tag", "name": "${tag}" },`,
  `"sha": "${sha}",`,
  `"path": "/Users/you/.scout/github.com/effect-ts/effect/tag/effect%404.1.4/${sha}",`,
  `"fetchedAt": "2026-11-15T18:21:46.521Z"`
]

const indent = (lines: ReadonlyArray<string>, depth: number) => lines.map((line) => `${" ".repeat(depth)}${line}`)

const addOutput = (result: "Downloaded" | "AlreadyCached") => [
  "{",
  `  "_tag": "${result}",`,
  `  "snapshot": {`,
  ...indent(snapshotFields, 4),
  "  }",
  "}"
]

const snapshotList = ["[", "  {", ...indent(snapshotFields, 4), "  }", "]"]

const suggestions = [
  addCommand,
  "scout list effect",
  `scout update ${repository}`,
  `scout remove ${repository} --tag ${tag}`,
  "scout --help"
]

const help = [
  "Manage source snapshots of GitHub repositories for agents",
  "",
  "USAGE",
  "  scout <subcommand> [flags]",
  "",
  "SUBCOMMANDS",
  "  add       Cache a snapshot of a GitHub repository",
  "  list      List the newest cached snapshot of each selection",
  "  update    Refresh cached branches older than one hour",
  "  remove    Remove one cached selection, or the whole repository",
  "  skill     Manage the agent skill that teaches agents to use scout"
]

interface Entry {
  readonly id: number
  readonly command: string
  readonly output: ReadonlyArray<string>
}

interface ShellResult {
  readonly output: ReadonlyArray<string>
  readonly cached: boolean
}

function run(command: string, cached: boolean): ShellResult {
  const normalized = command.trim().replace(/\s+/g, " ")

  if (normalized === addCommand) {
    return { output: addOutput(cached ? "AlreadyCached" : "Downloaded"), cached: true }
  }

  if (normalized === "scout list" || normalized === "scout list effect") {
    return { output: cached ? snapshotList : ["[]"], cached }
  }

  if (normalized === `scout update ${repository}`) {
    return { output: ["[]"], cached }
  }

  if (normalized === `scout remove ${repository} --tag ${tag}` || normalized === `scout remove ${repository}`) {
    return { output: cached ? snapshotList : ["[]"], cached: false }
  }

  if (normalized === "scout --help" || normalized === "scout" || normalized === "scout -h") {
    return { output: help, cached }
  }

  if (normalized === "") return { output: [], cached }

  return { output: [`zsh: this demo only runs scout · try one of the commands below`], cached }
}

function colorize(text: string) {
  const match = /^(\s*)"(\w+)": (.*)$/.exec(text)

  if (!match) return text

  const [, indent, key, value] = match

  return (
    <>
      {indent}
      <span className="text-muted-foreground">&quot;{key}&quot;</span>:{" "}
      <span className={key === "_tag" ? "text-signal" : "text-foreground"}>{value}</span>
    </>
  )
}

function Line({ text, index }: { text: string; index: number }) {

  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(4px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.2, ease: easeOut, delay: Math.min(index, 20) * 0.03 }}
      className="whitespace-pre-wrap [overflow-wrap:anywhere]"
    >
      {colorize(text)}
    </motion.div>
  )
}

function Shell() {
  const reduce = useReducedMotion()
  const [entries, setEntries] = useState<Array<Entry>>([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const cached = useRef(false)
  const nextId = useRef(0)
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const execute = useCallback((command: string) => {
    const result = run(command, cached.current)

    cached.current = result.cached
    setEntries((previous) => [...previous.slice(-6), { id: nextId.current++, command, output: result.output }])
    setInput("")
  }, [])

  const typeAndRun = useCallback(
    (command: string) => {
      if (typing) return

      if (reduce) {
        execute(command)

        return
      }

      setTyping(true)

      let count = 0

      const interval = setInterval(() => {
        count++
        setInput(command.slice(0, count))

        if (count >= command.length) {
          clearInterval(interval)
          timers.current.push(
            setTimeout(() => {
              execute(command)
              setTyping(false)
            }, 220)
          )
        }
      }, 18)

      timers.current.push(interval)
    },
    [execute, reduce, typing]
  )

  const typeAndRunRef = useRef(typeAndRun)

  typeAndRunRef.current = typeAndRun

  useEffect(() => {
    const pending = timers.current

    pending.push(setTimeout(() => typeAndRunRef.current(addCommand), 700))

    return () => {
      for (const timer of pending) clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!typing) execute(input)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[oklch(0.13_0.004_260)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-xs text-muted-foreground">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </span>
        <span>~/app — zsh</span>
        <span className="w-10" />
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="h-[360px] overflow-y-auto px-5 py-4 font-mono text-[13px] leading-6 text-foreground/85"
      >
        {entries.map((entry) => (
          <div key={entry.id} className="mb-3">
            <div className="text-foreground">
              <span className="mr-2 text-signal">❯</span>
              {entry.command}
            </div>
            {entry.output.map((text, index) => (
              <Line key={`${entry.id}-${index}`} text={text} index={index} />
            ))}
          </div>
        ))}

        <form onSubmit={onSubmit} className="flex items-center">
          <span className="mr-2 text-signal">❯</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            readOnly={typing}
            spellCheck={false}
            autoComplete="off"
            aria-label="Run a scout command"
            className="flex-1 bg-transparent text-foreground caret-signal outline-none placeholder:text-foreground/25"
            placeholder="type a scout command"
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
        {suggestions.map((command) => (
          <button
            key={command}
            type="button"
            disabled={typing}
            onClick={() => typeAndRun(command)}
            className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-[color,border-color,transform] duration-150 ease-out-strong active:scale-[0.97] disabled:opacity-50 [@media(hover:hover)_and_(pointer:fine)]:hover:border-foreground/25 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
          >
            {command.length > 44 ? `${command.slice(0, 41)}…` : command}
          </button>
        ))}
      </div>
    </div>
  )
}

const nav = [
  ["1", "Install", "#install"],
  ["2", "Commands", "#commands"],
  ["3", "Skill", "#install"],
  ["4", "GitHub", "https://github.com/ruangus/scout"]
] as const

export function Terminal() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[200px_1fr] lg:py-10">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="flex items-center gap-2.5 font-mono text-sm text-foreground">
            <span className="grid size-6 place-items-center rounded-[4px] bg-foreground text-[11px] font-semibold text-background">s</span>
            scout
          </div>
          <nav className="mt-8 flex gap-5 font-mono text-sm lg:flex-col lg:gap-2.5">
            {nav.map(([key, label, href]) => (
              <a
                key={label}
                href={href}
                className="text-muted-foreground transition-colors duration-150 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
              >
                <span className="text-foreground/30">[{key}]</span> {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="font-mono text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl"
          >
            Source code,
            <br />
            not memory<span className="text-signal">.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.06 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            scout downloads a read-only snapshot of any GitHub repository at the version you pin, and hands your coding agent the path. One CLI, one skill, no guessing.
          </motion.p>

          <motion.section
            id="commands"
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.12 }}
            className="mt-10"
          >
            <Shell />
          </motion.section>

          <section id="install" className="mt-10 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">01 · install the CLI</p>
              <CopyCommand command={install} />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">02 · teach your agents</p>
              <CopyCommand command="scout skill install" />
            </div>
          </section>

          <p className={cn("mt-6 font-mono text-xs text-muted-foreground")}>
            Works with Claude Code and any agent that reads ~/.agents/skills · MIT
          </p>
        </div>
      </div>
    </main>
  )
}
