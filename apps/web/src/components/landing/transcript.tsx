import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { session, source } from "./content"

const step = 140

function Beat({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${400 + index * step}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

function Tool({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div>
      <p className="flex gap-3">
        <span aria-hidden="true" className="text-signal select-none">
          ●
        </span>
        <span className="min-w-0 break-words">
          <span className="text-muted-foreground">Bash </span>
          {name}
        </span>
      </p>
      {children === undefined ? null : <div className="mt-1.5 pl-6 text-muted-foreground">{children}</div>}
    </div>
  )
}

const key = (name: string) => <span className="text-foreground/45">&quot;{name}&quot;</span>
const text = (value: string) => <span className="text-foreground/85">&quot;{value}&quot;</span>

export function Transcript() {
  const [first, last] = session.range

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_oklch(1_0_0/0.04)_inset,0_24px_60px_-32px_oklch(0_0_0/0.5)]">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
        </span>
        <span className="flex-1 text-center font-mono text-xs text-muted-foreground">agent session</span>
        <span aria-hidden="true" className="w-[42px]" />
      </div>

      <div className="space-y-5 px-4 py-5 font-mono text-[12.5px] leading-[1.7] sm:px-6 sm:py-6 sm:text-[13px]">
        <Beat index={0}>
          <p className="rounded-lg bg-foreground/[0.04] px-3 py-2 text-foreground">
            <span aria-hidden="true" className="mr-2 text-muted-foreground select-none">
              &gt;
            </span>
            {session.question}
          </p>
        </Beat>

        <Beat index={1}>
          <Tool name={`scout list effect`}>[]</Tool>
        </Beat>

        <Beat index={2}>
          <Tool name={`scout add ${session.url} --tag ${session.tag}`}>
            <pre className="overflow-x-auto whitespace-pre">
              {"{ "}
              {key("_tag")}: {text("Downloaded")}, {key("snapshot")}
              {": {\n    "}
              {key("path")}: <span className="text-foreground">&quot;{session.path}&quot;</span>
              {",\n    "}
              {key("selection")}
              {": { "}
              {key("_tag")}: {text("Tag")}, {key("name")}: {text(session.tag)}
              {" },\n    "}
              {key("sha")}: {text(`${session.sha}…`)}
              {"\n} }"}
            </pre>
          </Tool>
        </Beat>

        <Beat index={3}>
          <p className="flex gap-3">
            <span aria-hidden="true" className="text-signal select-none">
              ●
            </span>
            <span className="min-w-0 break-words">
              <span className="text-muted-foreground">Read </span>
              {session.file}
              <span className="text-muted-foreground">
                :{first}-{last}
              </span>
            </span>
          </p>
          <div className="mt-2 ml-6 overflow-x-auto rounded-lg border border-border">
            <div className="w-max min-w-full py-1.5">
              {source.map((code, index) => {
                const number = first + index
                const hit = number === session.line

                return (
                  <div key={number} className={cn("flex pr-4 whitespace-pre", hit && "bg-signal/10 shadow-[inset_2px_0_0_var(--signal)]")}>
                    <span className={cn("w-[7ch] shrink-0 pr-[2ch] text-right tabular-nums select-none", hit ? "text-signal" : "text-foreground/25")}>{number}</span>
                    <span className={hit ? "text-foreground" : "text-foreground/55"}>{code}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Beat>

        <Beat index={4} className="border-t border-border pt-5 font-sans text-[15px] leading-relaxed">
          <p className="text-pretty">
            In {session.tag}, <code className="font-mono text-[13px]">Effect.retry</code> takes an options object with a{" "}
            <code className="font-mono text-[13px]">times</code> field:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/[0.04] px-3 py-2 font-mono text-[13px]">{session.answer}</pre>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Source: <span className="text-signal tabular-nums">Effect.ts:{session.line}</span> at {session.sha}
          </p>
        </Beat>
      </div>
    </figure>
  )
}
