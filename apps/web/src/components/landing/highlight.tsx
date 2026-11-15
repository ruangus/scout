const token = /(\s+)|(\b(?:export|const|extends|import|from|type|interface)\b)|(\b\d+\b)|(\b[A-Z]\w*\b)|(\b\w+\b)|([^\s\w])/g

const tone = {
  keyword: "text-[oklch(0.76_0.13_305)]",
  number: "text-[oklch(0.82_0.12_150)]",
  type: "text-[oklch(0.82_0.09_200)]",
  name: "text-foreground/85",
  punctuation: "text-foreground/40"
}

export function Highlight({ code, emphasis }: { code: string; emphasis?: string }) {
  return (
    <>
      {Array.from(code.matchAll(token), (match, index) => {
        const [text, space, keyword, number, type] = match

        if (space !== undefined) return text

        const className =
          text === emphasis
            ? "text-signal"
            : keyword !== undefined
              ? tone.keyword
              : number !== undefined
                ? tone.number
                : type !== undefined
                  ? tone.type
                  : /\w/.test(text)
                    ? tone.name
                    : tone.punctuation

        return (
          <span key={index} className={className}>
            {text}
          </span>
        )
      })}
    </>
  )
}
