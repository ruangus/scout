"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import "./picker.css"
import { Contrast } from "./variants/contrast"
import { Story } from "./variants/story"
import { Terminal } from "./variants/terminal"

const variants = [
  { name: "Story", render: Story },
  { name: "Terminal", render: Terminal },
  { name: "Contrast", render: Contrast }
]

const indexFrom = (value: string | null) => {
  const requested = Number.parseInt(value ?? "", 10)

  return requested >= 1 && requested <= variants.length ? requested - 1 : 0
}

export function Harness() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [current, setCurrent] = useState(() => indexFrom(searchParams.get("v")))
  const [mountKey, setMountKey] = useState(0)
  const [ready, setReady] = useState(false)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const highlightRef = useRef<HTMLSpanElement>(null)

  const moveHighlight = useCallback(() => {
    const item = itemRefs.current[current]
    const highlight = highlightRef.current

    if (!item || !highlight) return

    highlight.style.width = `${item.offsetWidth}px`
    highlight.style.transform = `translateX(${item.offsetLeft}px)`
  }, [current])

  useLayoutEffect(moveHighlight, [moveHighlight])

  useEffect(() => {
    window.addEventListener("resize", moveHighlight)

    return () => window.removeEventListener("resize", moveHighlight)
  }, [moveHighlight])

  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))

    return () => cancelAnimationFrame(frame)
  }, [])

  const select = useCallback(
    (index: number) => {
      if (index < 0 || index >= variants.length) return

      setCurrent(index)
      setMountKey((key) => key + 1)
      router.replace(`${pathname}?v=${index + 1}`, { scroll: false })
    },
    [pathname, router]
  )

  const replay = useCallback(() => setMountKey((key) => key + 1), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target

      if (target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return

      if (event.metaKey || event.ctrlKey || event.altKey) return

      const number = Number.parseInt(event.key, 10)

      if (number >= 1 && number <= variants.length) select(number - 1)
      else if (event.key === "ArrowRight") select((current + 1) % variants.length)
      else if (event.key === "ArrowLeft") select((current - 1 + variants.length) % variants.length)
      else if (event.key === "r" || event.key === "R") replay()
    }

    document.addEventListener("keydown", onKeyDown)

    return () => document.removeEventListener("keydown", onKeyDown)
  }, [current, replay, select])

  const Variant = variants[current]?.render ?? Story

  return (
    <>
      <Variant key={`${current}-${mountKey}`} />
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}>
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
        {variants.map((variant, index) => (
          <button
            key={variant.name}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            type="button"
            className="proto-picker-item"
            data-active={index === current ? "" : undefined}
            aria-current={index === current ? "true" : undefined}
            onClick={() => select(index)}
          >
            {variant.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button type="button" className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={replay}>
          ↻
        </button>
      </nav>
    </>
  )
}
