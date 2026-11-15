import { Suspense } from "react"
import { Harness } from "./harness"

export default function LandingPrototypes() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  )
}
