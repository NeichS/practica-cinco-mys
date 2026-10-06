"use client"

import { Fragment } from "react"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import { Tex } from "@/components/tex"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { Model, ParamDef, Params } from "@/components/models/types"

const decimales = (step: number) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9))

function SliderParam({ def, value, onChange }: { def: Extract<ParamDef, { min: number }>; value: number; onChange: (v: number) => void }) {
  const id = `param-${def.key}`
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex min-w-0 items-baseline gap-1.5 font-normal">
          {def.symbol && (
            <span className="shrink-0 text-foreground">
              <Tex>{def.symbol}</Tex>
            </span>
          )}
          <span className="truncate text-muted-foreground" title={def.label}>{def.label}</span>
        </Label>
        <div className="flex shrink-0 items-center gap-1">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            value={Number(value.toFixed(decimales(def.step)))}
            step={def.step}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (Number.isFinite(v)) onChange(v)
            }}
            className="h-7 w-20 px-2 text-right font-mono text-xs tabular-nums"
          />
          {def.unit && <span className="min-w-8 text-xs text-muted-foreground">{def.unit}</span>}
        </div>
      </div>
      <Slider
        min={def.min}
        max={def.max}
        step={def.step}
        value={Math.min(def.max, Math.max(def.min, value))}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
        aria-label={def.label}
      />
    </div>
  )
}

export function ParamPanel({
  model,
  params,
  onChange,
  onReset,
}: {
  model: Model
  params: Params
  onChange: (key: string, value: Params[string]) => void
  onReset: () => void
}) {
  return (
    <Card className="shadow-[0_14px_36px_-30px_var(--foreground)]">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          Experimentá
        </CardTitle>
        <CardDescription>Elegí un caso o mové los controles. Todo se recalcula al instante.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" onClick={onReset} aria-label="Restablecer parámetros" title="Restablecer parámetros">
            <RotateCcw />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-5">
        {model.presets && (
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Escenarios rápidos</div>
            <div className="flex flex-wrap gap-1.5">
              {model.presets.map((pr) => (
                <Button
                  key={pr.label}
                  variant="outline"
                  size="xs"
                  onClick={() => Object.entries(pr.values).forEach(([k, v]) => onChange(k, v))}
                >
                  {pr.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        {model.params.map((def, i) => {
          const header =
            def.group && def.group !== model.params[i - 1]?.group ? (
              <div className="grid gap-3 pt-1">
                <Separator />
                <div className="text-xs font-semibold tracking-wide text-foreground/70 uppercase">{def.group}</div>
              </div>
            ) : null
          let control
          if (def.kind === "switch") {
            control = (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`param-${def.key}`} className="font-normal text-muted-foreground">
                  {def.label}
                </Label>
                <Switch id={`param-${def.key}`} checked={Boolean(params[def.key])} onCheckedChange={(c) => onChange(def.key, c)} />
              </div>
            )
          } else if (def.kind === "select") {
            control = (
              <div className="grid gap-2">
                <Label className="font-normal text-muted-foreground">{def.label}</Label>
                <Select
                  items={def.options}
                  value={String(params[def.key])}
                  onValueChange={(v) => v != null && onChange(def.key, v as string)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {def.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          } else {
            control = <SliderParam def={def} value={Number(params[def.key])} onChange={(v) => onChange(def.key, v)} />
          }
          return (
            <Fragment key={def.key}>
              {header}
              {control}
            </Fragment>
          )
        })}
      </CardContent>
    </Card>
  )
}
