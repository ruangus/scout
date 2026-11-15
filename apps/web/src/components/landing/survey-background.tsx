export function SurveyBackground() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id="survey" width="96" height="96" patternUnits="userSpaceOnUse">
          {[0, 24, 48, 72].flatMap((x) =>
            [0, 24, 48, 72].map((y) =>
              x === 0 && y === 0 ? null : <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="oklch(1 0 0 / 0.09)" />
            )
          )}
          <path d="M -4 0 H 4 M 0 -4 V 4 M 92 0 H 100 M 96 -4 V 4 M -4 96 H 4 M 0 92 V 100" stroke="oklch(1 0 0 / 0.2)" strokeWidth="1" />
        </pattern>
        <radialGradient id="survey-fade" cx="50%" cy="58%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="survey-mask">
          <rect width="100%" height="100%" fill="url(#survey-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#survey)" mask="url(#survey-mask)" />
    </svg>
  )
}
