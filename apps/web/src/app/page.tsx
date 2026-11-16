import { Address } from "@/components/landing/address"
import { CopyCommand } from "@/components/landing/copy-command"
import { github, install } from "@/components/landing/demo-content"
import { Wordmark } from "@/components/landing/wordmark"

const link = "text-muted-foreground hover:text-foreground"

const steps = [
  { label: "Install the CLI", command: install },
  { label: "Add the skill to your agent", command: "scout skill install" }
]

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-240 flex-col px-5 sm:px-8 gap-16">
      <header className="flex h-16 items-center justify-between">
        <Wordmark />
        <a href={github} aria-label="scout on GitHub" className={link}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-4.5">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
      </header>

      <section className="text-center">
        <h1 className="animate-rise [--rise-distance:12px] [--rise-duration:600ms] text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-semibold tracking-[-0.04em] text-balance">
          Answers from source, not memory.
        </h1>
        <p className="animate-rise mx-auto mt-6 max-w-132 text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground [animation-delay:90ms]">
          scout gives your coding agent your libraries' source at the exact version you run, so every answer cites a file and a line.
        </p>

        <div className="animate-rise mx-auto mt-9 max-w-120 text-left [--rise-distance:6px] [animation-delay:160ms]">
          <ol className="rounded-xl border border-border bg-card">
            {steps.map((step, index) => (
              <li key={step.command} className="border-border pb-1 not-first:border-t">
                <p className="flex gap-3 px-4 pt-3 text-xs text-muted-foreground">
                  <span aria-hidden="true" className="w-[1ch] font-mono text-foreground/40 tabular-nums">
                    {index + 1}
                  </span>
                  {step.label}
                </p>
                <CopyCommand command={step.command} className="h-10" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="animate-rise [--rise-distance:4px] [animation-delay:210ms]">
        <Address />
      </div>

      <footer className="mt-auto flex items-center justify-between gap-6 pt-24 pb-8 text-sm text-muted-foreground">
        <p>
          MIT licensed. Built by{" "}
          <a href="https://github.com/ruangus" className="text-foreground hover:underline hover:underline-offset-[3px]">
            Ruan Gustavo
          </a>
          .
        </p>
        <a href={`${github}#usage`} className={link}>
          Readme
        </a>
      </footer>
    </main>
  )
}
