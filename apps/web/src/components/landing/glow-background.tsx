export function GlowBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[-40%] left-1/2 h-[100vh] w-[130vw] -translate-x-1/2 bg-[radial-gradient(closest-side,oklch(0.83_0.15_78/0.085),transparent)]" />
      <div className="absolute top-[-12%] left-1/2 h-[50vh] w-[60vw] -translate-x-1/2 bg-[radial-gradient(closest-side,oklch(0.9_0.1_85/0.055),transparent)]" />
      <div className="absolute right-[-20%] bottom-[-35%] h-[80vh] w-[70vw] bg-[radial-gradient(closest-side,oklch(0.55_0.09_255/0.075),transparent)]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  )
}
