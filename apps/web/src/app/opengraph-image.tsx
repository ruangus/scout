import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt = "scout: Every answer has an address."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const color = {
  background: "#0b0c0e",
  tile: "#111214",
  foreground: "#f2f2f2",
  muted: "#909296",
  signal: "#fcba43",
  signalForeground: "#1d1406"
}

const font = {
  sans: "Geist",
  mono: "Geist Mono",
  serif: "Instrument Serif"
}

const fontFile = (name: string) => readFile(join(process.cwd(), "assets/fonts", name))

function Glow({ x, y, width, height, tint, strength }: { x: number; y: number; width: number; height: number; tint: string; strength: number }) {
  const id = `glow-${x}-${y}`

  return (
    <svg style={{ position: "absolute", left: x, top: y }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tint} stopOpacity={strength} />
          <stop offset="100%" stopColor={tint} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id})`} />
    </svg>
  )
}

function Handle({ side }: { side: { top?: number; bottom?: number; left?: number; right?: number } }) {
  return <div style={{ position: "absolute", ...side, width: 12, height: 12, border: `2px solid ${color.signal}`, backgroundColor: color.background }} />
}

function Lockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill={color.tile} stroke="rgba(255,255,255,0.1)" />
        <g stroke={color.signal} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 17.6C8 14.6 10.4 14.5 12 16.3S15.9 18.3 17.4 15.3" />
          <path d="M20 23.5L25.5 8.5" />
        </g>
      </svg>
      <span style={{ fontFamily: font.mono, fontSize: 29 }}>scout</span>
    </div>
  )
}

function Address() {
  return (
    <div style={{ position: "relative", display: "flex", border: "2px solid rgba(252,186,67,0.6)", backgroundColor: "rgba(252,186,67,0.07)" }}>
      <span style={{ display: "flex", padding: "0 14px 0 10px", fontFamily: font.serif, fontStyle: "italic", fontWeight: 400, fontSize: 146, letterSpacing: -1, lineHeight: 1.08 }}>
        address<span style={{ color: color.signal }}>.</span>
      </span>
      <Handle side={{ top: -7, left: -7 }} />
      <Handle side={{ top: -7, right: -7 }} />
      <Handle side={{ bottom: -7, left: -7 }} />
      <Handle side={{ bottom: -7, right: -7 }} />
      <div style={{ position: "absolute", right: -92, bottom: -64, display: "flex", alignItems: "flex-start" }}>
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path
            d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
            fill={color.signal}
            stroke={color.signal}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            marginTop: 30,
            padding: "4px 9px",
            borderRadius: 6,
            backgroundColor: color.signal,
            color: color.signalForeground,
            fontFamily: font.mono,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: 0
          }}
        >
          agent
        </span>
      </div>
    </div>
  )
}

export default async function Image() {
  const [sansBold, mono, monoMedium, serif] = await Promise.all([
    fontFile("geist-600.ttf"),
    fontFile("geist-mono-400.ttf"),
    fontFile("geist-mono-500.ttf"),
    fontFile("instrument-serif-italic.ttf")
  ])

  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", overflow: "hidden", backgroundColor: color.background, fontFamily: font.sans, color: color.foreground }}>
      <Glow x={-200} y={-420} width={1500} height={900} tint={color.signal} strength={0.11} />
      <Glow x={700} y={330} width={800} height={600} tint="#4c73a5" strength={0.12} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "64px 80px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup />
          <span style={{ fontFamily: font.mono, fontSize: 22, color: color.muted }}>github.com/ruangus/scout</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 600, letterSpacing: -5, lineHeight: 1.02 }}>
          <span>Every answer</span>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span style={{ marginRight: 40 }}>has an</span>
            <Address />
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: font.sans, data: sansBold, weight: 600, style: "normal" },
        { name: font.mono, data: mono, weight: 400, style: "normal" },
        { name: font.mono, data: monoMedium, weight: 500, style: "normal" },
        { name: font.serif, data: serif, weight: 400, style: "italic" }
      ]
    }
  )
}
