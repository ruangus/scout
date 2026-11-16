import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { address, question, source, sourceStart } from "@/components/landing/demo-content"

export const alt = "scout: Answers from source, not memory."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const color = {
  background: "#fafafa",
  card: "#ffffff",
  foreground: "#0a0a0a",
  border: "#e5e5e5",
  muted: "#737373",
  signal: "#a45e00"
}

const font = {
  sans: "Geist",
  mono: "Geist Mono"
}

const shown = { from: address.line - 3, to: address.line + 3 }

const fontFile = (name: string) => readFile(join(process.cwd(), "assets/fonts", name))

function SourceLine({ number, code }: { number: number; code: string }) {
  const hit = number === address.line

  return (
    <div
      style={{
        display: "flex",
        height: 38,
        alignItems: "center",
        whiteSpace: "pre",
        borderLeft: `3px solid ${hit ? color.signal : "transparent"}`,
        backgroundColor: hit ? "rgba(164,94,0,0.1)" : "transparent"
      }}
    >
      <span style={{ display: "flex", flexShrink: 0, justifyContent: "flex-end", width: 112, marginRight: 32, color: hit ? color.signal : "rgba(10,10,10,0.25)" }}>{number}</span>
      <span style={{ color: hit ? color.foreground : "rgba(10,10,10,0.6)" }}>{code}</span>
    </div>
  )
}

function Session() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: 1040,
        marginTop: 48,
        overflow: "hidden",
        border: `1.5px solid ${color.border}`,
        borderRadius: 18,
        backgroundColor: color.card,
        fontFamily: font.mono,
        fontSize: 21
      }}
    >
      <div style={{ display: "flex", gap: 16, padding: "18px 28px", borderBottom: `1.5px solid ${color.border}` }}>
        <span style={{ color: color.muted }}>&gt;</span>
        <span>{question}</span>
        <span style={{ marginLeft: "auto", color: color.signal }}>Effect.ts:{address.line}</span>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "14px 0" }}>
        {source.map((code, index) => {
          const number = sourceStart + index

          return number >= shown.from && number <= shown.to ? <SourceLine key={number} number={number} code={code} /> : null
        })}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 160, backgroundImage: `linear-gradient(to right, rgba(255,255,255,0), ${color.card})` }} />
      </div>
    </div>
  )
}

export default async function Image() {
  const [sansBold, mono] = await Promise.all([fontFile("geist-600.ttf"), fontFile("geist-mono-400.ttf")])

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: "48px 80px 0",
        overflow: "hidden",
        backgroundColor: color.background,
        fontFamily: font.sans,
        color: color.foreground
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexShrink: 0, fontFamily: font.mono }}>
        <span style={{ display: "flex", fontSize: 28 }}>
          <span style={{ marginRight: 10, color: color.muted }}>~/</span>scout
        </span>
        <span style={{ fontSize: 22, color: color.muted }}>github.com/ruangus/scout</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, marginTop: 44, fontSize: 92, fontWeight: 600, letterSpacing: -3.7, lineHeight: 1 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span>Answers</span>
          <span>from</span>
        </div>
        <span>source, not memory.</span>
      </div>
      <Session />
    </div>,
    {
      ...size,
      fonts: [
        { name: font.sans, data: sansBold, weight: 600, style: "normal" },
        { name: font.mono, data: mono, weight: 400, style: "normal" }
      ]
    }
  )
}
