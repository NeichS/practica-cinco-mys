"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  usePlotArea,
  useXAxisDomain,
  useXAxisInverseScale,
  useYAxisDomain,
  useYAxisInverseScale,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmt } from "@/lib/ode"
import { mid, niceTicks, scaleRange, shiftRange, ZOOM_PASO, ZoomToolbar, type DragMode, type View } from "@/components/zoom"

/**
 * Capa transparente sobre el área de graficado: rueda = zoom en el cursor,
 * arrastre = zoom a un área o desplazamiento, doble clic = restablecer.
 * Va dentro del ComposedChart para acceder a las escalas de los ejes.
 */
function ZoomLayer({
  modo,
  logY,
  viewRef,
  onView,
  onReset,
}: {
  modo: DragMode
  logY: boolean
  viewRef: RefObject<View | null>
  onView: (v: View) => void
  onReset: () => void
}) {
  const area = usePlotArea()
  const ix = useXAxisInverseScale()
  const iy = useYAxisInverseScale()
  const xd = useXAxisDomain()
  const yd = useYAxisDomain()
  const rect = useRef<SVGRectElement>(null)
  const drag = useRef<{ px: number; py: number; view: View } | null>(null)
  const [sel, setSel] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const actual = (): View | null =>
    xd && yd && typeof xd[0] === "number" && typeof yd[0] === "number"
      ? { x: [Number(xd[0]), Number(xd[1])], y: [Number(yd[0]), Number(yd[1])] }
      : null

  useEffect(() => {
    viewRef.current = actual()
  })

  const local = (e: { clientX: number; clientY: number }) => {
    const r = rect.current!.ownerSVGElement!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const dato = (px: number, py: number) => [Number(ix?.(px)), Number(iy?.(py))] as const

  useEffect(() => {
    const el = rect.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const v = actual()
      if (!v || !ix || !iy) return
      e.preventDefault()
      const f = Math.min(1.5, Math.max(0.66, Math.exp(e.deltaY * 0.0015)))
      const [px, py] = local(e)
      const [cx, cy] = dato(px, py)
      onView({ x: scaleRange(v.x, cx, f), y: scaleRange(v.y, cy, f, logY) })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  if (!area || !ix || !iy) return null

  return (
    <g>
      {sel && (
        <rect
          x={Math.min(sel.x0, sel.x1)}
          y={Math.min(sel.y0, sel.y1)}
          width={Math.abs(sel.x1 - sel.x0)}
          height={Math.abs(sel.y1 - sel.y0)}
          className="fill-primary/10 stroke-primary/60"
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}
      <rect
        ref={rect}
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        fill="transparent"
        className={modo === "mover" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          const v = actual()
          if (!v || e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          const [px, py] = local(e)
          drag.current = { px, py, view: v }
          if (modo === "area") setSel({ x0: px, y0: py, x1: px, y1: py })
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const [px, py] = local(e)
          if (modo === "area") {
            const cx = Math.min(Math.max(px, area.x), area.x + area.width)
            const cy = Math.min(Math.max(py, area.y), area.y + area.height)
            setSel((s) => s && { ...s, x1: cx, y1: cy })
            return
          }
          const [x0, y0] = dato(d.px, d.py)
          const [x1, y1] = dato(px, py)
          onView({
            x: shiftRange(d.view.x, x0 - x1),
            y: logY ? shiftRange(d.view.y, Math.log10(y0 / y1), true) : shiftRange(d.view.y, y0 - y1),
          })
        }}
        onPointerUp={() => {
          drag.current = null
          if (modo === "area" && sel && Math.abs(sel.x1 - sel.x0) > 8 && Math.abs(sel.y1 - sel.y0) > 8) {
            const [xa, ya] = dato(Math.min(sel.x0, sel.x1), Math.max(sel.y0, sel.y1))
            const [xb, yb] = dato(Math.max(sel.x0, sel.x1), Math.min(sel.y0, sel.y1))
            onView({ x: [xa, xb], y: [ya, yb] })
          }
          setSel(null)
        }}
        onDoubleClick={onReset}
      />
    </g>
  )
}

export type Series = {
  key: string
  label: string
  color: string
  /** line = curva continua, dots = sólo marcadores, step = escalonada */
  type?: "line" | "dots" | "step"
  dashed?: boolean
  width?: number
}

export type RefLine = { x?: number; y?: number; label?: string; color?: string }

export function TimeChart({
  data,
  series,
  xKey = "t",
  xLabel,
  yLabel,
  refLines = [],
  logY = false,
  yDomain,
  xDomain,
  className = "aspect-[2/1] w-full",
}: {
  data: Record<string, number | null>[]
  series: Series[]
  xKey?: string
  xLabel?: string
  yLabel?: string
  refLines?: RefLine[]
  logY?: boolean
  yDomain?: [number | string, number | string]
  xDomain?: [number | string, number | string]
  className?: string
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  const [view, setView] = useState<View | null>(null)
  const [modo, setModo] = useState<DragMode>("area")
  const viewRef = useRef<View | null>(null)
  const zoomBoton = (f: number) => {
    const v = viewRef.current
    if (v) setView({ x: scaleRange(v.x, mid(v.x), f), y: scaleRange(v.y, mid(v.y, logY), f, logY) })
  }

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
    <ChartContainer config={config} className={className}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          type="number"
          domain={view?.x ?? xDomain ?? ["dataMin", "dataMax"]}
          allowDataOverflow={!!view}
          ticks={view ? niceTicks(view.x[0], view.x[1]) : undefined}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => fmt(v, view ? 4 : 3)}
          label={xLabel ? { value: xLabel, position: "insideBottom", offset: -14, className: "fill-muted-foreground text-xs" } : undefined}
        />
        <YAxis
          scale={logY ? "log" : "auto"}
          domain={view?.y ?? yDomain ?? ["auto", "auto"]}
          allowDataOverflow={!!view || !!yDomain}
          ticks={view && !logY ? niceTicks(view.y[0], view.y[1]) : undefined}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => fmt(v, view ? 4 : 3)}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", offset: 4, className: "fill-muted-foreground text-xs", style: { textAnchor: "middle" } } : undefined}
        />
        {refLines.map((r, i) => (
          <ReferenceLine
            key={i}
            x={r.x}
            y={r.y}
            stroke={r.color ?? "var(--muted-foreground)"}
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            ifOverflow="hidden"
            label={r.label ? { value: r.label, position: r.x !== undefined ? "insideTopRight" : "insideBottomRight", className: "fill-muted-foreground text-[10px]" } : undefined}
          />
        ))}
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                `${xLabel ?? xKey} = ${fmt(Number(payload?.[0]?.payload?.[xKey]), 4)}`
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.key}
            type={s.type === "step" ? "stepAfter" : "linear"}
            stroke={`var(--color-${s.key})`}
            strokeWidth={s.type === "dots" ? 0 : (s.width ?? 2)}
            strokeDasharray={s.dashed ? "6 4" : undefined}
            dot={
              s.type === "dots"
                ? { r: 3.5, fill: `var(--color-${s.key})`, stroke: "var(--background)", strokeWidth: 1.5 }
                : false
            }
            activeDot={{ r: 4 }}
            connectNulls={s.type !== "dots"}
            isAnimationActive={false}
            legendType={s.type === "dots" ? "circle" : "line"}
          />
        ))}
        <ZoomLayer modo={modo} logY={logY} viewRef={viewRef} onView={setView} onReset={() => setView(null)} />
      </ComposedChart>
    </ChartContainer>
    </div>
  )
}
