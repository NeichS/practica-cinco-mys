"use client"

import { useMemo } from "react"
import { Stat, StatGrid } from "@/components/stat"
import { TimeChart, type Series } from "@/components/time-chart"
import { ChartCard } from "@/components/chart-card"
import { fmt, rk4 } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

const N = 240
const CADA = 10
const FAMILIA_K = [0.02, 0.05, 0.1, 0.2, 0.5]
/** Constantes C = T0 − Tamb de la solución general T = Tamb + C·e^{−kt}. */
const FAMILIA_C = [-40, -20, 20, 40, 60]

function View({ p }: { p: Params }) {
  const k = num(p, "k")
  const T0 = num(p, "T0")
  const Tamb = num(p, "Tamb")
  const tFin = num(p, "tFin")
  const Tobj = num(p, "Tobj")
  const superponer = String(p.superponer)

  const exacta = (t: number, kk = k, c = T0 - Tamb) => Tamb + c * Math.exp(-kk * t)

  const { data, err } = useMemo(() => {
    const h = tFin / N
    const num = rk4((_, [T]) => [-k * (T - Tamb)], [T0], tFin, h * CADA)
    let err = 0
    const data: Record<string, number | null>[] = []
    for (let i = 0; i <= N; i++) {
      const t = i * h
      const row: Record<string, number | null> = { t, T: exacta(t), rk4: null }
      if (i % CADA === 0) {
        const v = num.zs[i / CADA][0]
        row.rk4 = v
        err = Math.max(err, Math.abs(v - exacta(t)))
      }
      if (superponer === "k") FAMILIA_K.forEach((kk, j) => (row[`f${j}`] = exacta(t, kk)))
      if (superponer === "c") FAMILIA_C.forEach((c, j) => (row[`f${j}`] = exacta(t, k, c)))
      data.push(row)
    }
    return { data, err }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, T0, Tamb, tFin, superponer])

  const familia = superponer !== "ninguna"
  const etiquetas =
    superponer === "k"
      ? FAMILIA_K.map((kk) => `k = ${kk}`)
      : superponer === "c"
        ? FAMILIA_C.map((c) => `T0 = ${fmt(Tamb + c)} (C = ${c})`)
        : []
  const series: Series[] = [
    ...etiquetas.map((label, j) => ({
      key: `f${j}`,
      label,
      color: `var(--chart-${j + 2})`,
      width: 1.25,
      dashed: true,
    })),
    { key: "T", label: "T(t) analítica", color: "var(--chart-1)", width: 2.5 },
    // con la familia visible los puntos RK4 se ocultan para no repetir colores
    ...(familia ? [] : [{ key: "rk4", label: "RK4", color: "var(--chart-2)", type: "dots" } as Series]),
  ]

  const tau = 1 / k
  const tObj = Math.log((T0 - Tamb) / (Tobj - Tamb)) / k
  const yAcotado = k < 0 ? ([Math.min(T0, Tamb) - 20, Math.max(T0, Tamb) + 200] as [number, number]) : undefined

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat label="τ = 1/k" value={`${fmt(tau)} min`} hint={k > 0 ? "cae 63 % de T0 − Tamb" : "k ≤ 0: no hay relajación"} />
        <Stat label="t½ = ln2 / |k|" value={`${fmt(Math.log(2) / Math.abs(k))} min`} hint={k > 0 ? "vida media de la diferencia" : "tiempo de duplicación"} />
        <Stat label="dT/dt (0)" value={`${fmt(-k * (T0 - Tamb))} °C/min`} />
        <Stat
          label={`t hasta ${fmt(Tobj)} °C`}
          value={Number.isFinite(tObj) && tObj >= 0 ? `${fmt(tObj)} min` : "nunca"}
          hint={`T(${fmt(tFin)}) = ${fmt(exacta(tFin))} °C · error RK4 ${fmt(err)}`}
        />
      </StatGrid>
      <ChartCard
        title="Temperatura en función del tiempo"
        description={
          superponer === "c"
            ? "Familia de soluciones T = Tamb + C·e^(−kt): misma ecuación, distinta condición inicial. Todas tienden a Tamb y nunca se cruzan."
            : superponer === "k"
              ? "Mismo T0 y Tamb con distintos k: k solo cambia la velocidad del proceso."
              : "Línea: solución analítica · puntos: RK4 · línea punteada: temperatura ambiente y t = τ"
        }
      >
        <TimeChart
          data={data}
          series={series}
          xLabel="t [min]"
          yLabel="T [°C]"
          yDomain={yAcotado}
          refLines={[
            { y: Tamb, label: `Tamb = ${fmt(Tamb)} °C` },
            ...(k > 0 && tau <= tFin ? [{ x: tau, label: "τ" }] : []),
            ...(Number.isFinite(tObj) && tObj > 0 && tObj <= tFin ? [{ y: Tobj, label: `objetivo ${fmt(Tobj)} °C`, color: "var(--chart-3)" }] : []),
          ]}
        />
      </ChartCard>
    </div>
  )
}

export const enfriamiento: Model = {
  id: "enfriamiento",
  ejercicio: "Ej. 1",
  title: "Enfriamiento de Newton",
  description: "Una taza de café que se enfría hacia la temperatura ambiente.",
  question: "¿Cómo cambian el tiempo de enfriamiento y la curva al variar k o la temperatura ambiente?",
  equation: String.raw`\frac{dT}{dt} = -k\,(T - T_{amb}) \;\Rightarrow\; T(t) = T_{amb} + (T_0 - T_{amb})\,e^{-kt}`,
  params: [
    { key: "k", label: "Constante de enfriamiento", symbol: "k", unit: "1/min", min: -0.1, max: 1, step: 0.005 },
    { key: "T0", label: "Temperatura inicial", symbol: "T_0", unit: "°C", min: -20, max: 100, step: 1 },
    { key: "Tamb", label: "Temperatura ambiente", symbol: "T_{amb}", unit: "°C", min: -30, max: 50, step: 1 },
    { key: "Tobj", label: "Temperatura objetivo", symbol: "T_{obj}", unit: "°C", min: -30, max: 100, step: 1, group: "Análisis" },
    { key: "tFin", label: "Tiempo de simulación", symbol: "t_f", unit: "min", min: 5, max: 300, step: 5, group: "Análisis" },
    {
      kind: "select",
      key: "superponer",
      label: "Superponer curvas",
      group: "Análisis",
      options: [
        { value: "ninguna", label: "Ninguna" },
        { value: "c", label: "Familia de soluciones (distintas T0)" },
        { value: "k", label: "Familia de k (0.02 … 0.5)" },
      ],
    },
  ],
  defaults: { k: 0.1, T0: 90, Tamb: 20, Tobj: 25, tFin: 60, superponer: "ninguna" },
  presets: [
    { label: "Café", values: { k: 0.1, T0: 90, Tamb: 20, tFin: 60 } },
    { label: "Freezer", values: { k: 0.1, T0: 90, Tamb: -18, tFin: 60 } },
    { label: "Calentamiento", values: { k: 0.1, T0: 5, Tamb: 20, tFin: 60 } },
    { label: "k < 0", values: { k: -0.05, T0: 90, Tamb: 20, tFin: 60 } },
  ],
  teoria: TEORIA.enfriamiento,
  View,
}
