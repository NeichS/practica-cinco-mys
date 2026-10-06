"use client"

import { useMemo } from "react"
import { ChartCard } from "@/components/chart-card"
import { PhasePlane, type Trajectory } from "@/components/phase-plane"
import { Stat, StatGrid } from "@/components/stat"
import { TimeChart } from "@/components/time-chart"
import { euler, fmt, rk4 } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

const H_REF = 0.005
const MAX_ROWS = 500

function View({ p, set }: { p: Params; set: (patch: Params) => void }) {
  const a = num(p, "alpha")
  const b = num(p, "beta")
  const d = num(p, "delta")
  const g = num(p, "gamma")
  const x0 = num(p, "x0")
  const y0 = num(p, "y0")
  const tFin = num(p, "tFin")
  const h = num(p, "h")
  const metodos = Boolean(p.metodos)

  const f = (_: number, [x, y]: number[]) => [a * x - b * x * y, d * x * y - g * y]
  const V = (x: number, y: number) => d * x - g * Math.log(x) + b * y - a * Math.log(y)
  const xEq = g / d
  const yEq = a / b

  const sim = useMemo(() => {
    const ref = rk4(f, [x0, y0], tFin, H_REF)
    const eu = euler(f, [x0, y0], tFin, h)
    const r4 = rk4(f, [x0, y0], tFin, h)
    const xs = ref.zs.map((z) => z[0])
    const maxIdx: number[] = []
    for (let i = 1; i < xs.length - 1; i++) if (xs[i - 1] < xs[i] && xs[i] >= xs[i + 1]) maxIdx.push(i)
    const periodo = maxIdx.length > 1 ? ((maxIdx.at(-1)! - maxIdx[0]) * H_REF) / (maxIdx.length - 1) : NaN
    const paso = Math.ceil(ref.ts.length / MAX_ROWS)
    const serie = ref.ts.filter((_, i) => i % paso === 0).map((t, j) => ({ t, x: ref.zs[j * paso][0], y: ref.zs[j * paso][1] }))
    const V0 = V(x0, y0)
    const pasoV = Math.max(1, Math.ceil(eu.ts.length / MAX_ROWS))
    const deriva: Record<string, number | null>[] = []
    let maxEu = 0
    let maxR4 = 0
    eu.ts.forEach((t, i) => {
      const de = Math.abs(V(eu.zs[i][0], eu.zs[i][1]) - V0)
      const dr = Math.abs(V(r4.zs[i][0], r4.zs[i][1]) - V0)
      if (Number.isFinite(de)) maxEu = Math.max(maxEu, de)
      if (Number.isFinite(dr)) maxR4 = Math.max(maxR4, dr)
      if (i > 0 && i % pasoV === 0)
        deriva.push({
          t,
          euler: Number.isFinite(de) ? Math.max(de, 1e-16) : null,
          rk4: Number.isFinite(dr) ? Math.max(dr, 1e-16) : null,
        })
    })
    const ext = (k: 0 | 1) => [Math.min(...ref.zs.map((z) => z[k])), Math.max(...ref.zs.map((z) => z[k]))]
    return { ref, eu, r4, periodo, serie, deriva, maxEu, maxR4, rx: ext(0), ry: ext(1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, d, g, x0, y0, tFin, h])

  const orbitas = useMemo(() => {
    const out: Trajectory[] = []
    for (const k of [0.3, 0.6, 1.3, 2]) {
      const s = rk4(f, [xEq * k, yEq], 30, 0.01)
      out.push({ pts: s.zs.map(([x, y]) => [x, y]), color: "var(--muted-foreground)", width: 1.1, opacity: 0.6 })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, d, g])

  const tr: Trajectory[] = [...orbitas]
  if (metodos) {
    tr.push({ pts: sim.eu.zs.map(([x, y]) => [x, y]), color: "var(--chart-2)", width: 1.5 })
    tr.push({ pts: sim.r4.zs.map(([x, y]) => [x, y]), color: "var(--chart-3)", width: 2, dashed: true })
  }
  tr.push({ pts: sim.ref.zs.map(([x, y]) => [x, y]), color: "var(--chart-1)", width: metodos ? 1.75 : 2.75 })

  const xMax = Math.max(sim.rx[1], xEq * 2.2, x0) * 1.1
  const yMax = Math.max(sim.ry[1], yEq * 1.6, y0) * 1.1
  const cap = (v: number, m: number) => Math.min(v, m * 12)

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat label="Equilibrio (γ/δ, α/β)" value={`(${fmt(xEq)}, ${fmt(yEq)})`} hint="centro: órbitas cerradas" />
        <Stat label="Período lineal 2π/√(αγ)" value={fmt((2 * Math.PI) / Math.sqrt(a * g))} hint={`observado: ${fmt(sim.periodo)}`} />
        <Stat label="Presas x(t)" value={`${fmt(sim.rx[0])} – ${fmt(sim.rx[1])}`} hint="mín – máx" />
        <Stat label="Depredadores y(t)" value={`${fmt(sim.ry[0])} – ${fmt(sim.ry[1])}`} hint="mín – máx" />
      </StatGrid>
      <ChartCard title="Evolución temporal" description={`RK4 con h = ${H_REF} (referencia) · líneas punteadas: niveles de equilibrio`}>
        <TimeChart
          data={sim.serie}
          series={[
            { key: "x", label: "Presas x(t)", color: "var(--chart-1)", width: 2.25 },
            { key: "y", label: "Depredadores y(t)", color: "var(--chart-2)", width: 2.25 },
          ]}
          xLabel="t"
          yLabel="población"
          refLines={[
            { y: xEq, color: "var(--chart-1)" },
            { y: yEq, color: "var(--chart-2)" },
          ]}
        />
      </ChartCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Plano de fase"
          description={
            metodos ? (
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                <Leyenda c="chart-1">referencia</Leyenda>
                <Leyenda c="chart-2">Euler h = {h}</Leyenda>
                <Leyenda c="chart-3">RK4 h = {h}</Leyenda>
                <span>· gris: otras órbitas</span>
              </span>
            ) : (
              "Órbitas cerradas alrededor del equilibrio (★). Clic para elegir (x₀, y₀)."
            )
          }
        >
          <PhasePlane
            xDomain={[0, cap(xMax, xEq)]}
            yDomain={[0, cap(yMax, yEq)]}
            field={(x, y) => f(0, [x, y]) as [number, number]}
            trajectories={tr}
            markers={[
              { x: xEq, y: yEq, shape: "star" },
              { x: 0, y: 0 },
              { x: x0, y: y0, shape: "ring", color: "var(--chart-1)" },
            ]}
            xLabel="presas x"
            yLabel="depredadores y"
            onPick={(x, y) => x > 0 && y > 0 && set({ x0: x, y0: y })}
          />
        </ChartCard>
        <ChartCard
          title="Deriva de la cantidad conservada"
          description={
            <>
              |V(x, y) − V₀| con V = δx − γ ln x + βy − α ln y · máx Euler {fmt(sim.maxEu)}, máx RK4 {fmt(sim.maxR4)}
            </>
          }
        >
          <TimeChart
            data={sim.deriva}
            series={[
              { key: "euler", label: `Euler h = ${h}`, color: "var(--chart-2)" },
              { key: "rk4", label: `RK4 h = ${h}`, color: "var(--chart-3)" },
            ]}
            xLabel="t"
            yLabel="|ΔV| (log)"
            logY
            xDomain={[0, tFin]}
            yDomain={[1e-16, "auto"]}
            className="aspect-[6/5] w-full"
          />
        </ChartCard>
      </div>
    </div>
  )
}

function Leyenda({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="inline-block h-0.5 w-3 rounded" style={{ background: `var(--${c})` }} />
      {children}
    </span>
  )
}

export const lotkaVolterra: Model = {
  id: "lotka-volterra",
  ejercicio: "Ej. 5",
  title: "Lotka-Volterra",
  description: "Modelo depredador-presa: oscilaciones y conservación.",
  equation: String.raw`\dot x = \alpha x - \beta x y,\qquad \dot y = \delta x y - \gamma y`,
  params: [
    { key: "alpha", label: "Natalidad de presas", symbol: "\\alpha", min: 0.1, max: 3, step: 0.05 },
    { key: "beta", label: "Tasa de predación", symbol: "\\beta", min: 0.05, max: 1.5, step: 0.01 },
    { key: "delta", label: "Conversión presa → depredador", symbol: "\\delta", min: 0.01, max: 0.5, step: 0.005 },
    { key: "gamma", label: "Mortalidad de depredadores", symbol: "\\gamma", min: 0.1, max: 2, step: 0.05 },
    { key: "x0", label: "Presas iniciales", symbol: "x_0", min: 0.5, max: 40, step: 0.5, group: "Condición inicial" },
    { key: "y0", label: "Depredadores iniciales", symbol: "y_0", min: 0.5, max: 20, step: 0.5, group: "Condición inicial" },
    { key: "tFin", label: "Tiempo de simulación", symbol: "t_f", min: 10, max: 150, step: 5, group: "Simulación" },
    { key: "h", label: "Paso de Euler / RK4", symbol: "h", min: 0.005, max: 0.2, step: 0.005, group: "Simulación" },
    { kind: "switch", key: "metodos", label: "Comparar Euler vs RK4 en el plano de fase", group: "Simulación" },
  ],
  defaults: { alpha: 1.1, beta: 0.4, delta: 0.1, gamma: 0.4, x0: 10, y0: 10, tFin: 50, h: 0.05, metodos: true },
  presets: [
    { label: "Práctico", values: { alpha: 1.1, beta: 0.4, delta: 0.1, gamma: 0.4, x0: 10, y0: 10 } },
    { label: "Cerca del equilibrio", values: { alpha: 1.1, beta: 0.4, delta: 0.1, gamma: 0.4, x0: 4.5, y0: 3 } },
    { label: "Oscilación grande", values: { alpha: 1.1, beta: 0.4, delta: 0.1, gamma: 0.4, x0: 30, y0: 2 } },
  ],
  teoria: TEORIA["lotka-volterra"],
  View,
}
