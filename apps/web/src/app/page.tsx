import { CopyCommand } from "@/components/landing/copy-command"
import { PathDemo } from "@/components/landing/path-demo"
import { SurveyBackground } from "@/components/landing/survey-background"
import { Wordmark } from "@/components/landing/wordmark"

const install = "bun add -g @ruangus/scout"

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <SurveyBackground />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-5">
        <header className="flex items-center justify-between">
          <Wordmark />
          <a
            href="https://github.com/ruangus/scout"
            className="text-sm text-muted-foreground transition-colors duration-150 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
          >
            GitHub
          </a>
        </header>

        <section className="grid gap-8 pt-10 pb-8 md:grid-cols-[1fr_360px] md:items-end lg:pt-14">
          <h1 className="animate-rise text-5xl leading-[1.02] font-semibold tracking-tight text-foreground lg:text-6xl">
            Every answer
            <br />
            has an address.
          </h1>
          <div className="animate-rise [animation-delay:60ms]">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              scout keeps the source of the libraries you use at a path on your disk, pinned to the branch, tag, or commit you run. Your agent reads it there, instead of from memory.
            </p>
            <CopyCommand command={install} className="mt-4" />
          </div>
        </section>

        <section className="animate-rise [animation-delay:120ms]">
          <PathDemo />
        </section>
      </div>
    </main>
  )
}
