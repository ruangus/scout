import { CopyCommand } from "@/components/landing/copy-command"
import { PathDemo } from "@/components/landing/path-demo"
import { GlowBackground } from "@/components/landing/glow-background"
import { Headline } from "@/components/landing/headline"
import { Wordmark } from "@/components/landing/wordmark"

const install = "bun add -g @ruangus/scout"

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <GlowBackground />

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
          <Headline />
          <div className="animate-rise [animation-delay:70ms]">
            <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
              <span className="text-foreground">Your agent reads the code you run, not its memory of it.</span> scout keeps each library
              on disk, pinned to the version you use.
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
