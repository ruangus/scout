"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { typed, useTimeline } from "@/hooks/use-timeline"
import { cn } from "@/lib/utils"
import { question, sha, sourceLine } from "./demo-content"
import { Highlight } from "./highlight"

const lead = 600
const speed = 22

const at = {
  bash: question.length * speed + 300,
  bashDone: question.length * speed + 1150,
  read: question.length * speed + 1400,
  readDone: question.length * speed + 1650,
  answer: question.length * speed + 2900,
  prompt: question.length * speed + 3400
}

const end = lead + at.prompt + 200
const short = sha.slice(0, 7)
const surface = "bg-[oklch(0.135_0.004_260)]"

const trafficLights = [
  "bg-[radial-gradient(circle_at_50%_30%,#ff8f88,#ff5f57_55%,#e0443e)]",
  "bg-[radial-gradient(circle_at_50%_30%,#ffd977,#febc2e_55%,#dfa023)]",
  "bg-[radial-gradient(circle_at_50%_30%,#6ee27c,#28c840_55%,#1ba72f)]"
]

const tone = {
  done: "text-[oklch(0.82_0.12_150)]",
  type: "text-[oklch(0.82_0.09_200)]"
}

const frames = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"]

const spinner = (time: number) => frames[Math.floor(Math.max(time, 0) / 110) % frames.length]

function ReplayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function Caret({ blink }: { blink: boolean }) {
  return <span className={cn("inline-block h-[1.15em] w-[0.6em] translate-y-[0.22em] bg-foreground/70", blink && "animate-blink")} />
}

function Tool({ name, args, running, children }: { name: string; args: string; running?: number; children: ReactNode }) {
  return (
    <div>
      <p className="flex min-w-0 whitespace-pre">
        <span className={running === undefined ? tone.done : "text-foreground/50"}>⏺ </span>
        <span className="font-semibold text-foreground">{name}</span>
        <span className="min-w-0 truncate text-foreground/60">({args})</span>
      </p>
      <p className="truncate pl-[2ch] text-foreground/55">
        <span className="text-foreground/30">⎿</span>{" "}
        {running === undefined ? (
          children
        ) : (
          <>
            <span className="text-signal">{spinner(running)}</span> Running…
          </>
        )}
      </p>
    </div>
  )
}

function Message({ children }: { children: ReactNode }) {
  return (
    <p className="pl-[2ch] -indent-[2ch] text-foreground">
      <span>⏺</span> {children}
    </p>
  )
}

function Banner() {
  return (
    <div className="relative rounded-md border border-signal/45 px-4 pt-3 pb-2.5">
      <span className={cn("absolute -top-2.5 left-3 px-1.5 text-signal", surface)}>agent</span>
      <p className="text-foreground">skill: scout</p>
      <p className="text-foreground/40">~/app</p>
    </div>
  )
}

function Session({ onReplay }: { onReplay: () => void }) {
  const { time: clock } = useTimeline(end)
  const time = clock - lead
  const asked = typed(question, time, 0, speed)
  const viewport = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = viewport.current

    if (element) element.scrollTop = element.scrollHeight
  })

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border shadow-[0_24px_60px_-28px_oklch(0_0_0/0.7)]", surface)}>
      <div className="relative flex h-10 items-center border-b border-border px-4">
        <div aria-hidden="true" className="flex gap-2">
          {trafficLights.map((color) => (
            <span key={color} className={cn("size-3 rounded-full shadow-[inset_0_0_0_0.5px_oklch(0_0_0/0.3)]", color)} />
          ))}
        </div>
        <p className="pointer-events-none absolute inset-x-16 text-center text-[13px] text-muted-foreground">agent — ~/app</p>
        <button
          type="button"
          aria-label="Replay"
          onClick={onReplay}
          className="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
        >
          <ReplayIcon />
        </button>
      </div>

      <div
        ref={viewport}
        className="h-[400px] space-y-4 overflow-hidden px-6 py-6 font-mono text-[13.5px] leading-[1.7] scroll-fade-t scroll-fade-t-16"
      >
        <Banner />

        <p className="rounded bg-foreground/[0.05] px-2 py-1">
          <span className="text-foreground/40">&gt;</span> <span className="text-foreground">{asked.text}</span>
          {time < at.bash ? <Caret blink={!asked.typing} /> : null}
        </p>

        {time >= at.bash ? (
          <Tool name="Bash" args="scout add https://github.com/effect-ts/effect --tag effect@4.1.4" running={time < at.bashDone ? time - at.bash : undefined}>
            Downloaded effect-ts/effect, tag effect@4.1.4 <span className="text-signal">({short})</span>
          </Tool>
        ) : null}

        {time >= at.read ? (
          <Tool name="Read" args={`~/.scout/…/effect%404.1.4/${short}…/packages/effect/src/Effect.ts`} running={time < at.readDone ? time - at.read : undefined}>
            Read 48 lines from {sourceLine - 20}
          </Tool>
        ) : null}

        {time >= at.readDone && time < at.answer ? (
          <p className="text-signal">
            {spinner(time)} <span className="text-foreground/60">Reading Effect.ts… ({Math.max(1, Math.ceil((time - at.readDone) / 1000))}s)</span>
          </p>
        ) : null}

        {time >= at.answer ? (
          <div className="space-y-2">
            <Message>
              Use <span className={tone.type}>Effect.retry</span> with the <span className={tone.type}>times</span> option:
            </Message>
            <p className="pl-[4ch]">
              <Highlight code="task.pipe(Effect.retry({ times: 3 }))" emphasis="retry" />
            </p>
            <p className="pl-[2ch] text-foreground/60">
              Read from <span className="text-signal">Effect.ts:{sourceLine + 1}</span> at tag effect@4.1.4, the version this project runs.
            </p>
          </div>
        ) : null}

        {time >= at.prompt ? (
          <p className="px-2">
            <span className="text-foreground/40">&gt;</span> <Caret blink />
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function AgentSession() {
  const [run, setRun] = useState(0)

  return <Session key={run} onReplay={() => setRun((value) => value + 1)} />
}
