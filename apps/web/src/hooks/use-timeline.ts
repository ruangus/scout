"use client"

import { useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

export const easeOut = [0.23, 1, 0.32, 1] as const
export const easeInOut = [0.77, 0, 0.175, 1] as const

export function useTimeline(end: number, playing: boolean) {
  const reduce = useReducedMotion() ?? false
  const [time, setTime] = useState(0)
  const origin = useRef(0)

  useEffect(() => {
    if (reduce) {
      setTime(end)

      return
    }

    if (!playing) return

    origin.current = performance.now()

    let frame = 0

    const tick = () => {
      const elapsed = Math.min(performance.now() - origin.current, end)

      setTime(elapsed)

      if (elapsed < end) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [end, playing, reduce])

  return { time, reduce }
}

export const typed = (text: string, time: number, start: number, speed: number) => {
  const count = Math.max(0, Math.min(text.length, Math.floor((time - start) / speed)))

  return { text: text.slice(0, count), typing: count > 0 && count < text.length }
}
