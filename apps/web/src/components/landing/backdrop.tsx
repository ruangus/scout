"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const mask = "linear-gradient(to right, black calc(50% - 34rem), transparent calc(50% - 24rem), transparent calc(50% + 20rem), black calc(50% + 28rem))"

const vertex = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`

const fragment = `#version 300 es
precision highp float;

uniform vec2 resolution;
uniform float density;
uniform float time;
uniform vec3 color;
uniform float strength;

out vec4 pixel;

const float cell = 4.0;
const int bayer[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);

float hash(vec2 point) {
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}

float noise(vec2 point) {
  vec2 whole = floor(point);
  vec2 part = fract(point);
  vec2 blend = part * part * (3.0 - 2.0 * part);
  float bottom = mix(hash(whole), hash(whole + vec2(1.0, 0.0)), blend.x);
  float top = mix(hash(whole + vec2(0.0, 1.0)), hash(whole + vec2(1.0, 1.0)), blend.x);
  return mix(bottom, top, blend.y);
}

float clouds(vec2 point) {
  float sum = 0.0;
  float weight = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    sum += weight * noise(point);
    point = point * 2.03 + 17.0;
    weight *= 0.5;
  }
  return sum;
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / density;
  vec2 index = floor(css / cell);
  vec2 offset = css - index * cell;

  if (offset.x >= 1.0 || offset.y >= 1.0) discard;

  vec2 center = index * cell + cell * 0.5;
  vec2 drift = vec2(time * 0.018, time * -0.011);
  float across = center.x - resolution.x / density * 0.5;
  float reach = across < 0.0 ? 540.0 : 400.0;
  float wobble = (noise(vec2(center.y * 0.004, across < 0.0 ? 3.0 : 11.0) + drift) - 0.5) * 180.0;
  float side = smoothstep(reach + wobble, reach + wobble + 280.0, abs(across));
  float field = clamp(smoothstep(0.38, 0.78, clouds(center * 0.0032 + drift)) + side * 0.3, 0.0, 1.0);
  ivec2 slot = ivec2(mod(index, 4.0));
  float threshold = (float(bayer[slot.y * 4 + slot.x]) + 0.5) / 16.0;

  if (field <= threshold) discard;

  float alpha = strength * mix(0.55, 1.0, field);
  pixel = vec4(color * alpha, alpha);
}`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)

  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

function link(gl: WebGL2RenderingContext) {
  const vertexShader = compile(gl, gl.VERTEX_SHADER, vertex)
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()

  if (!vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

function rgb(variable: string) {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })

  if (!context) return [1, 1, 1]

  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(variable)
  context.fillRect(0, 0, 1, 1)

  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data

  return [red / 255, green / 255, blue / 255]
}

export function Backdrop() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const element = canvas.current
    const gl = element?.getContext("webgl2", { antialias: false })

    if (!element || !gl) return

    const program = link(gl)

    if (!program) return

    gl.useProgram(program)

    const uniform = (name: string) => gl.getUniformLocation(program, name)
    const dark = matchMedia("(prefers-color-scheme: dark)")
    const still = matchMedia("(prefers-reduced-motion: reduce)")
    const origin = performance.now()

    const theme = () => {
      gl.uniform3fv(uniform("color"), rgb("--foreground"))
      gl.uniform1f(uniform("strength"), dark.matches ? 0.18 : 0.12)
    }

    const paint = () => {
      gl.uniform1f(uniform("time"), still.matches ? 0 : (performance.now() - origin) / 1000)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const density = Math.min(devicePixelRatio, 2)

      element.width = Math.round(element.clientWidth * density)
      element.height = Math.round(element.clientHeight * density)
      gl.viewport(0, 0, element.width, element.height)
      gl.uniform2f(uniform("resolution"), element.width, element.height)
      gl.uniform1f(uniform("density"), density)
      paint()
    }

    const retheme = () => {
      theme()
      paint()
    }

    let frame = 0
    let last = 0

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)

      if (now - last < 33) return

      last = now
      paint()
    }

    const observer = new ResizeObserver(resize)

    theme()
    resize()
    setReady(true)
    observer.observe(element)
    dark.addEventListener("change", retheme)

    if (!still.matches) frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      dark.removeEventListener("change", retheme)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{ maskImage: mask }}
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ease-out-strong motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0"
      )}
    >
      <canvas ref={canvas} className="block size-full" />
    </div>
  )
}
