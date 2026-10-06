"use client"

import { useMemo } from "react"
import { ChartCard } from "@/components/chart-card"
import { Stat, StatGrid } from "@/components/stat"
import { TimeChart, type RefLine, type Series } from "@/components/time-chart"
import { fmt, rk4 } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

const N = 400
const CADA = 20
/** Múltiplos de P0 para la familia de soluciones P = C·e^{rt}. */
const FAMILIA_C = [0.25, 0.5, 2, 3, 4]
const FAMILIA_R = [-0.02, 0, 0.01, 0.05, 0.08]

function View({ p }: { p: Params }) {
  const r = num(p, "r")
  const P0 = num(p, "P0")
  const tFin = num(p, "tFin")
  const logY = Boolean(p.logY)
  const superponer = String(p.superponer)

  const exacta = (t: number) => P0 * Math.exp(r * t)

  const { data, err } = useMemo(() => {
    const h = tFin / N
    const sol = rk4((_, [P]) => [r * P], [P0], tFin, h * CADA)
    let err = 0
    const data: Record<string, number | null>[] = []
    for (let i = 0; i <= N; i++) {
      const t = i * h
      const row: Record<string, number | null> = { t, P: exacta(t), rk4: null }
      if (superponer === "c") FAMILIA_C.forEach((c, j) => (row[`f${j}`] = c * P0 * Math.exp(r * t)))
      if (superponer === "r") FAMILIA_R.forEach((rr, j) => (row[`f${j}`] = P0 * Math.exp(rr * t)))
      if (i % CADA === 0) {
        row.rk4 = sol.zs[i / CADA][0]
        err = Math.max(err, Math.abs(row.rk4 - exacta(t)) / exacta(t))
      }
      data.push(row)
    }
    return { data, err }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, P0, tFin, superponer])

  const etiquetas =
    superponer === "c"
      ? FAMILIA_C.map((c) => `P0 = ${fmt(c * P0)}`)
      : superponer === "r"
        ? FAMILIA_R.map((rr) => `r = ${rr}`)
        : []
  const familia: Series[] = etiquetas.map((label, j) => ({
    key: `f${j}`,
    label,
    color: `var(--chart-${j + 2})`,
    width: 1.25,
    dashed: true,
  }))

  const tDup = Math.log(2) / Math.abs(r)
  const refs: RefLine[] = []
  if (r !== 0) for (let n = 1; n * tDup <= tFin && n <= 12; n++) refs.push({ x: n * tDup, label: n === 1 ? (r > 0 ? "×2" : "÷2") : undefined })

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat
          label={r >= 0 ? "Tiempo de duplicación ln2/r" : "Tiempo de reducción a la mitad"}
          value={r === 0 ? "∞" : `${fmt(tDup)} años`}
        />
        <Stat label={`P(${fmt(tFin)})`} value={fmt(exacta(tFin))} hint={`factor ×${fmt(Math.exp(r * tFin))}`} />
        <Stat label="dP/dt (0)" value={`${fmt(r * P0)} /año`} />
        <Stat label="Error relativo RK4" value={fmt(err)} hint={`h = ${fmt((tFin / N) * CADA)} años`} />
      </StatGrid>
      <ChartCard
        title="Población en función del tiempo"
        description={
          superponer === "c"
            ? "Familia de soluciones P = C·e^(rt): distintas poblaciones iniciales con la misma tasa. En escala log son rectas paralelas."
            : superponer === "r"
              ? "Misma P0 con distintas tasas r: en escala log cada una es una recta de pendiente r."
              : logY
                ? "Escala logarítmica: la exponencial se vuelve una recta de pendiente r"
                : "Líneas verticales: múltiplos del tiempo de duplicación"
        }
      >
        <TimeChart
          data={data}
          series={[
            ...familia,
            { key: "P", label: "P(t) analítica", color: "var(--chart-1)", width: 2.5 },
            // con la familia visible los puntos RK4 se ocultan para no repetir colores
            ...(familia.length ? [] : [{ key: "rk4", label: "RK4", color: "var(--chart-2)", type: "dots" } as Series]),
          ]}
          xLabel="t [años]"
          yLabel="P(t)"
          logY={logY}
          refLines={familia.length ? [] : refs}
        />
      </ChartCard>
    </div>
  )
}

export const malthus: Model = {
  id: "malthus",
  ejercicio: "Ej. 2",
  title: "Crecimiento de Malthus",
  description: "Población que crece (o decrece) a tasa proporcional a su tamaño.",
  question: "¿Cuánto cambia una población cuando modificamos su tasa de crecimiento r?",
  equation: String.raw`\frac{dP}{dt} = r\,P \;\Rightarrow\; P(t) = P_0\,e^{rt}`,
  params: [
    { key: "r", label: "Tasa de crecimiento", symbol: "r", unit: "1/año", min: -0.1, max: 0.1, step: 0.001 },
    { key: "P0", label: "Población inicial", symbol: "P_0", min: 10, max: 10000, step: 10 },
    { key: "tFin", label: "Horizonte", symbol: "t_f", unit: "años", min: 10, max: 500, step: 10, group: "Análisis" },
    { kind: "switch", key: "logY", label: "Eje vertical logarítmico", group: "Análisis" },
    {
      kind: "select",
      key: "superponer",
      label: "Superponer curvas",
      group: "Análisis",
      options: [
        { value: "ninguna", label: "Ninguna" },
        { value: "c", label: "Familia de soluciones (distintas P0)" },
        { value: "r", label: "Familia de r (−2 % … 8 %)" },
      ],
    },
  ],
  defaults: { r: 0.03, P0: 1000, tFin: 200, logY: false, superponer: "ninguna" },
  presets: [
    { label: "r = 3 %", values: { r: 0.03 } },
    { label: "r = 5 %", values: { r: 0.05 } },
    { label: "r = 0", values: { r: 0 } },
    { label: "r = −2 %", values: { r: -0.02 } },
  ],
  teoria: TEORIA.malthus,
  View,
}
