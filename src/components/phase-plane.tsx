"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { mid, niceTicks, scaleRange, shiftRange, ZOOM_PASO, ZoomToolbar, type DragMode, type View } from "@/components/zoom"
import { fmt } from "@/lib/ode"

export type Trajectory = {
  pts: [number, number][]
  color: string
  width?: number
  dashed?: boolean
  opacity?: number
  label?: string
}

export type Marker = { x: number; y: number; label?: string; shape?: "dot" | "star" | "ring"; color?: string }

const W = 480
const H = 400
const PAD = { l: 44, r: 12, t: 12, b: 36 }


export function PhasePlane({
  xDomain,
  yDomain,
  field,
  trajectories = [],
  lines = [],
  markers = [],
  xLabel = "x",
  yLabel = "y",
  onPick,
  gridN = 19,
}: {
  xDomain: [number, number]
  yDomain: [number, number]
  field?: (x: number, y: number) => [number, number]
  trajectories?: Trajectory[]
  /** Rectas por el origen con dirección (dx, dy), p.ej. autovectores. */
  lines?: { dir: [number, number]; color?: string }[]
  markers?: Marker[]
  xLabel?: string
  yLabel?: string
  onPick?: (x: number, y: number) => void
  gridN?: number
}) {
  const clip = useId()
  const svg = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [modo, setModo] = useState<DragMode>("mover")
  const drag = useRef<{ px: number; py: number; view: View; movido: boolean } | null>(null)
  const [sel, setSel] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [x0, x1] = view?.x ?? xDomain
  const [y0, y1] = view?.y ?? yDomain
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * iw
  const sy = (y: number) => PAD.t + (1 - (y - y0) / (y1 - y0)) * ih

  const arrows = useMemo(() => {
    if (!field) return []
    const cells: { x: number; y: number; u: number; v: number; m: number }[] = []
    const ny = Math.round((gridN * ih) / iw)
    for (let i = 0; i < gridN; i++)
      for (let j = 0; j < ny; j++) {
        const x = x0 + ((i + 0.5) / gridN) * (x1 - x0)
        const y = y0 + ((j + 0.5) / ny) * (y1 - y0)
        const [u, v] = field(x, y)
        // dirección en coordenadas de pantalla
        const pu = (u / (x1 - x0)) * iw
        const pv = (-v / (y1 - y0)) * ih
        const m = Math.hypot(pu, pv)
        cells.push({ x: sx(x), y: sy(y), u: m ? pu / m : 0, v: m ? pv / m : 0, m: Math.hypot(u, v) })
      }
    const ms = cells.map((c) => c.m).sort((a, b) => a - b)
    const ref = ms[Math.floor(ms.length * 0.9)] || 1
    return cells.map((c) => ({ ...c, a: 0.25 + 0.55 * Math.min(1, c.m / ref) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, x0, x1, y0, y1, gridN])

  const toPx = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = svg.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
  }
  const pxToData = (px: number, py: number): [number, number] => [
    x0 + ((px - PAD.l) / iw) * (x1 - x0),
    y0 + (1 - (py - PAD.t) / ih) * (y1 - y0),
  ]
  const toData = (e: { clientX: number; clientY: number }): [number, number] | null => {
    const [px, py] = toPx(e)
    if (px < PAD.l || px > W - PAD.r || py < PAD.t || py > H - PAD.b) return null
    return pxToData(px, py)
  }
  const actual: View = { x: [x0, x1], y: [y0, y1] }

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const p = toData(e)
      if (!p) return
      e.preventDefault()
      const f = Math.min(1.5, Math.max(0.66, Math.exp(e.deltaY * 0.0015)))
      setView({ x: scaleRange(actual.x, p[0], f), y: scaleRange(actual.y, p[1], f) })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })
  const zoomBoton = (f: number) => setView({ x: scaleRange(actual.x, mid(actual.x), f), y: scaleRange(actual.y, mid(actual.y), f) })

  const L = (iw / gridN) * 0.38
  const path = (pts: [number, number][]) =>
    pts
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < 1e6 && Math.abs(y) < 1e6)
      .map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
      .join("")

  const hv = hover && field ? field(hover[0], hover[1]) : null

  return (
    <div className="flex flex-col gap-2">
    <ZoomToolbar
      modo={modo}
      onModo={setModo}
      onZoomIn={() => zoomBoton(ZOOM_PASO)}
      onZoomOut={() => zoomBoton(1 / ZOOM_PASO)}
      onReset={() => setView(null)}
      zoomed={view !== null}
    />
    <div className="relative">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full touch-none select-none ${modo === "mover" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
        onPointerDown={(e) => {
          if (e.button !== 0 || !toData(e)) return
          e.currentTarget.setPointerCapture(e.pointerId)
          const [px, py] = toPx(e)
          drag.current = { px, py, view: actual, movido: false }
          if (modo === "area") setSel({ x0: px, y0: py, x1: px, y1: py })
        }}
        onPointerMove={(e) => {
          setHover(toData(e))
          const d = drag.current
          if (!d) return
          const [px, py] = toPx(e)
          if (Math.hypot(px - d.px, py - d.py) > 4) d.movido = true
          if (modo === "area") {
            const cx = Math.min(Math.max(px, PAD.l), PAD.l + iw)
            const cy = Math.min(Math.max(py, PAD.t), PAD.t + ih)
            setSel((s) => s && { ...s, x1: cx, y1: cy })
            return
          }
          const [vx0, vx1] = d.view.x
          const [vy0, vy1] = d.view.y
          setView({
            x: shiftRange(d.view.x, (-(px - d.px) / iw) * (vx1 - vx0)),
            y: shiftRange(d.view.y, ((py - d.py) / ih) * (vy1 - vy0)),
          })
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (modo === "area" && sel && Math.abs(sel.x1 - sel.x0) > 8 && Math.abs(sel.y1 - sel.y0) > 8) {
            const [xa, ya] = pxToData(Math.min(sel.x0, sel.x1), Math.max(sel.y0, sel.y1))
            const [xb, yb] = pxToData(Math.max(sel.x0, sel.x1), Math.min(sel.y0, sel.y1))
            setView({ x: [xa, xb], y: [ya, yb] })
          }
          setSel(null)
          // un clic sin arrastrar fija la condición inicial
          if (d && !d.movido && onPick) {
            const p = toData(e)
            if (p) onPick(Number(p[0].toPrecision(3)), Number(p[1].toPrecision(3)))
          }
        }}
        onDoubleClick={() => setView(null)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Plano de fase ${xLabel}-${yLabel}`}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PAD.l} y={PAD.t} width={iw} height={ih} />
          </clipPath>
        </defs>
        {/* grilla y ejes */}
        {niceTicks(x0, x1).map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={PAD.t} y2={PAD.t + ih} className="stroke-border" strokeDasharray="3 3" />
            <text x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {fmt(t)}
            </text>
          </g>
        ))}
        {niceTicks(y0, y1).map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.l} x2={PAD.l + iw} y1={sy(t)} y2={sy(t)} className="stroke-border" strokeDasharray="3 3" />
            <text x={PAD.l - 6} y={sy(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {fmt(t)}
            </text>
          </g>
        ))}
        <text x={PAD.l + iw / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-xs">
          {xLabel}
        </text>
        <text x={12} y={PAD.t + ih / 2} textAnchor="middle" transform={`rotate(-90 12 ${PAD.t + ih / 2})`} className="fill-muted-foreground text-xs">
          {yLabel}
        </text>

        <g clipPath={`url(#${clip})`}>
          {x0 < 0 && x1 > 0 && <line x1={sx(0)} x2={sx(0)} y1={PAD.t} y2={PAD.t + ih} className="stroke-muted-foreground/40" />}
          {y0 < 0 && y1 > 0 && <line x1={PAD.l} x2={PAD.l + iw} y1={sy(0)} y2={sy(0)} className="stroke-muted-foreground/40" />}

          {arrows.map((a, i) => {
            const xa = a.x - (a.u * L) / 2
            const ya = a.y - (a.v * L) / 2
            const xb = a.x + (a.u * L) / 2
            const yb = a.y + (a.v * L) / 2
            const hx = -a.u * 4
            const hy = -a.v * 4
            return (
              <g key={i} className="stroke-muted-foreground" strokeOpacity={a.a} strokeWidth={1.1} strokeLinecap="round">
                <line x1={xa} y1={ya} x2={xb} y2={yb} />
                <line x1={xb} y1={yb} x2={xb + hx - a.v * 2.5} y2={yb + hy + a.u * 2.5} />
                <line x1={xb} y1={yb} x2={xb + hx + a.v * 2.5} y2={yb + hy - a.u * 2.5} />
              </g>
            )
          })}

          {lines.map((l, i) => {
            const k = 1e3
            return (
              <line
                key={i}
                x1={sx(-l.dir[0] * k)}
                y1={sy(-l.dir[1] * k)}
                x2={sx(l.dir[0] * k)}
                y2={sy(l.dir[1] * k)}
                stroke={l.color ?? "var(--foreground)"}
                strokeDasharray="6 4"
                strokeOpacity={0.6}
              />
            )
          })}

          {trajectories.map((tr, i) => (
            <path
              key={i}
              d={path(tr.pts)}
              fill="none"
              stroke={tr.color}
              strokeWidth={tr.width ?? 2}
              strokeOpacity={tr.opacity ?? 1}
              strokeDasharray={tr.dashed ? "5 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {markers.map((m, i) =>
            m.shape === "star" ? (
              <text key={i} x={sx(m.x)} y={sy(m.y) + 6} textAnchor="middle" className="text-lg" fill={m.color ?? "var(--foreground)"}>
                ★
              </text>
            ) : (
              <circle
                key={i}
                cx={sx(m.x)}
                cy={sy(m.y)}
                r={5}
                fill={m.shape === "ring" ? "var(--background)" : (m.color ?? "var(--foreground)")}
                stroke={m.color ?? "var(--foreground)"}
                strokeWidth={2}
              />
            )
          )}

          {sel && (
            <rect
              x={Math.min(sel.x0, sel.x1)}
              y={Math.min(sel.y0, sel.y1)}
              width={Math.abs(sel.x1 - sel.x0)}
              height={Math.abs(sel.y1 - sel.y0)}
              className="pointer-events-none fill-primary/10 stroke-primary/60"
              strokeDasharray="4 3"
            />
          )}
          {hover && (
            <g className="pointer-events-none">
              <line x1={sx(hover[0])} x2={sx(hover[0])} y1={PAD.t} y2={PAD.t + ih} className="stroke-foreground/30" />
              <line x1={PAD.l} x2={PAD.l + iw} y1={sy(hover[1])} y2={sy(hover[1])} className="stroke-foreground/30" />
            </g>
          )}
        </g>
      </svg>
      {hover && (
        <div className="pointer-events-none absolute top-2 right-3 rounded-md border bg-background/90 px-2 py-1 font-mono text-[11px] shadow-sm backdrop-blur">
          ({fmt(hover[0])}, {fmt(hover[1])})
          {hv && (
            <span className="text-muted-foreground">
              {"  "}→ ({fmt(hv[0])}, {fmt(hv[1])})
            </span>
          )}
          {onPick && <div className="text-muted-foreground">clic: fijar condición inicial</div>}
        </div>
      )}
    </div>
    </div>
  )
}
