"use client"

import { Hand, Maximize, SquareDashedMousePointer, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type Range = [number, number]
export type View = { x: Range; y: Range }
export type DragMode = "area" | "mover"

/** Escala un intervalo por `f` alrededor de `c` (f < 1 acerca, f > 1 aleja). En ejes log trabaja en log10. */
export function scaleRange([a, b]: Range, c: number, f: number, log = false): Range {
  if (log) {
    const [la, lb, lc] = [a, b, c].map((v) => Math.log10(Math.max(v, 1e-300)))
    return [10 ** (lc + (la - lc) * f), 10 ** (lc + (lb - lc) * f)]
  }
  return [c + (a - c) * f, c + (b - c) * f]
}

/** Desplaza un intervalo `d` unidades (en ejes log, `d` es un factor multiplicativo en log10). */
export function shiftRange([a, b]: Range, d: number, log = false): Range {
  if (log) return [a * 10 ** d, b * 10 ** d]
  return [a + d, b + d]
}

export const mid = ([a, b]: Range, log = false) => (log ? Math.sqrt(Math.max(a, 1e-300) * Math.max(b, 1e-300)) : (a + b) / 2)

export const ZOOM_PASO = 0.7

/** Marcas "redondas" (1, 2, 2.5, 5 × 10ⁿ) dentro de [a, b]. */
export function niceTicks(a: number, b: number, n = 6) {
  const span = b - a
  if (!(span > 0) || !Number.isFinite(span)) return []
  const raw = span / n
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-6; v += step) out.push(Number(v.toPrecision(12)))
  return out
}

function Accion({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ZoomToolbar({
  modo,
  onModo,
  onZoomIn,
  onZoomOut,
  onReset,
  zoomed,
}: {
  modo: DragMode
  onModo: (m: DragMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  zoomed: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <span className="hidden text-[11px] text-muted-foreground md:inline">
        Rueda: zoom · Arrastrar: {modo === "area" ? "elegir área" : "mover"} · Doble clic: restablecer
      </span>
      <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
        <ToggleGroup value={[modo]} onValueChange={(v) => v[0] && onModo(v[0] as DragMode)} size="sm">
          <Tooltip>
            <TooltipTrigger render={<ToggleGroupItem value="area" aria-label="Zoom a un área" />}>
              <SquareDashedMousePointer />
            </TooltipTrigger>
            <TooltipContent>Arrastrar para hacer zoom a un área</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<ToggleGroupItem value="mover" aria-label="Mover" />}>
              <Hand />
            </TooltipTrigger>
            <TooltipContent>Arrastrar para mover la vista</TooltipContent>
          </Tooltip>
        </ToggleGroup>
        <div className="mx-0.5 h-5 w-px bg-border" />
        <Accion label="Acercar" onClick={onZoomIn}>
          <ZoomIn />
        </Accion>
        <Accion label="Alejar" onClick={onZoomOut}>
          <ZoomOut />
        </Accion>
        <Accion label="Restablecer vista" onClick={onReset} disabled={!zoomed}>
          <Maximize />
        </Accion>
      </div>
    </div>
  )
}
