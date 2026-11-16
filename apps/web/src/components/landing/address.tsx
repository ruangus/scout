"use client"

import { useInView } from "motion/react"
import { useRef, useState } from "react"
import { typed, useTimeline } from "@/hooks/use-timeline"
import { cn } from "@/lib/utils"
import { address, answer, question, source, sourceStart } from "./demo-content"

const speed = 24
const asked = question.length * speed

const at = {
  fetch: asked + 400,
  commit: asked + 900,
  file: asked + 1500,
  line: asked + 1900,
  answer: asked + 2700
}

const reveal = "transition-opacity duration-300 ease-out-strong motion-reduce:transition-none"
const sweep = "duration-500 ease-out-strong motion-reduce:transition-none"

function Field({ name, shown, accent, children }: { name: string; shown: boolean; accent?: boolean; children: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{name}</dt>
      <dd className="relative mt-1 truncate font-mono text-[13px] tabular-nums">
        <span className={cn(reveal, accent && "text-signal", shown ? "opacity-100" : "opacity-0")}>{children}</span>
        <span aria-hidden="true" className={cn(reveal, "absolute top-0 left-0 text-foreground/25", shown ? "opacity-0" : "opacity-100")}>
          —
        </span>
      </dd>
    </div>
  )
}

function Session({ lead, onReplay }: { lead: number; onReplay: () => void }) {
  const figure = useRef<HTMLElement>(null)
  const inView = useInView(figure, { once: true, amount: 0.4 })
  const { time: clock } = useTimeline(lead + at.answer + 400, inView)
  const time = clock - lead
  const prompt = typed(question, time, 0, speed)
  const read = time >= at.file
  const cited = time >= at.line
  const answered = time >= at.answer
  const status = time < at.fetch ? "" : time < at.file ? `Fetching ${address.tag}…` : "Reading Effect.ts…"

  return (
    <figure
      ref={figure}
      aria-label={`An agent is asked: ${question} It fetches ${address.repository} at tag ${address.tag}, reads line ${address.line} of ${address.file}, and answers: ${answer}`}
      className="overflow-hidden rounded-xl border border-border bg-card text-left"
    >
      <div aria-hidden="true" className="flex min-h-12 items-baseline gap-3 border-b border-border px-5 py-3.5 font-mono text-[13px] leading-5">
        <span className="text-muted-foreground select-none">&gt;</span>
        <p className="min-w-0 flex-1">
          {prompt.text}
          {time < at.fetch ? <span className={cn("ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-foreground/70", !prompt.typing && "animate-blink")} /> : null}
        </p>
      </div>

      <div aria-hidden="true" className="grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <dl className="grid grid-cols-2 content-start gap-x-5 gap-y-5 border-border p-5 max-lg:border-b sm:grid-cols-3 lg:grid-cols-1 lg:border-r">
          <Field name="Repository" shown={time >= at.fetch}>
            {address.repository}
          </Field>
          <Field name="Tag" shown={time >= at.fetch}>
            {address.tag}
          </Field>
          <Field name="Commit" shown={time >= at.commit}>
            {address.commit}
          </Field>
          <div className="col-span-2 max-sm:order-last lg:col-span-1">
            <Field name="File" shown={read}>
              {address.file}
            </Field>
          </div>
          <Field name="Line" shown={cited} accent>
            {address.line}
          </Field>
        </dl>

        <div
          className={cn(
            reveal,
            "flex min-w-0 items-center overflow-hidden [mask-image:linear-gradient(transparent,black_18%,black_82%,transparent)] lg:h-[clamp(20rem,100dvh_-_47rem,27.5rem)]",
            read ? "opacity-100" : "opacity-25"
          )}
        >
          <div className="w-full min-w-0 shrink-0 overflow-x-auto py-4 font-mono text-[13px] leading-6">
            <div className="w-max min-w-full">
              {source.map((code, index) => {
                const number = sourceStart + index
                const hit = number === address.line

                return (
                  <div key={number} className="relative flex pr-5 whitespace-pre">
                    {hit ? (
                      <span
                        className={cn(
                          sweep,
                          "absolute inset-0 origin-left border-l-2 border-signal bg-signal/10 transition-transform",
                          cited ? "scale-x-100" : "scale-x-0"
                        )}
                      />
                    ) : null}
                    <span className={cn(hit && sweep, "relative w-[8ch] shrink-0 pr-[2ch] text-right tabular-nums transition-colors select-none", hit && cited ? "text-signal" : "text-foreground/25")}>
                      {number}
                    </span>
                    <span className={cn(hit && sweep, "relative transition-colors", hit && cited ? "text-foreground" : "text-foreground/60")}>{code}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-12 items-center gap-3 border-t border-border px-5 py-2.5 font-mono text-[13px] leading-5">
        <p aria-hidden="true" className="min-w-0 flex-1 break-words">
          {answered ? answer : <span className="text-muted-foreground">{status}</span>}
        </p>
        {answered ? (
          <span aria-hidden="true" className="shrink-0 text-signal tabular-nums max-sm:hidden">
            Effect.ts:{address.line}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onReplay}
          className="-mr-2 shrink-0 rounded-md motion-reduce:hidden px-2 py-1 text-muted-foreground transition-transform duration-100 ease-out [-webkit-tap-highlight-color:transparent] hover:text-foreground focus-visible:outline-2 active:scale-[0.97] motion-reduce:transition-none"
        >
          Replay
        </button>
      </div>
    </figure>
  )
}

export function Address() {
  const [run, setRun] = useState(0)

  return <Session key={run} lead={run === 0 ? 600 : 150} onReplay={() => setRun((value) => value + 1)} />
}
