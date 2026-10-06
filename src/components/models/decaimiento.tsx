"use client"

import { useMemo } from "react"
import { ChartCard } from "@/components/chart-card"
import { Stat, StatGrid } from "@/components/stat"
import { TimeChart, type RefLine } from "@/components/time-chart"
import { binomial, fmt, rk4, rng } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

const N = 300
const CADA = 15

export const ISOTOPOS: Record<string, { label: string; thalf: number; unidad: string }> = {
  c14: { label: "Carbono-14", thalf: 5730, unidad: "años" },
  cs137: { label: "Cesio-137", thalf: 30.17, unidad: "años" },
  co60: { label: "Cobalto-60", thalf: 5.27, unidad: "años" },
  i131: { label: "Yodo-131", thalf: 8.02, unidad: "días" },
}

const unidad = (p: Params) => ISOTOPOS[String(p.isotopo)]?.unidad ?? "u.t."

function View({ p }: { p: Params }) {
  const thalf = num(p, "thalf")
  const ciclos = num(p, "ciclos")
  const nMC = num(p, "nMC")
  const seed = num(p, "seed")
  const frac = num(p, "frac")
  const u = unidad(p)

  const lam = Math.log(2) / thalf
  const tFin = ciclos * thalf

  const { data, err } = useMemo(() => {
    const h = tFin / N
    const sol = rk4((_, [n]) => [-lam * n], [1], tFin, h * CADA)
    const rand = rng(seed)
    const pDec = 1 - Math.exp(-lam * h)
    let restantes = nMC
    let err = 0
    const data: Record<string, number | null>[] = []
    for (let i = 0; i <= N; i++) {
      const t = i * h
      if (i > 0) restantes -= binomial(restantes, pDec, rand)
      const row: Record<string, number | null> = { t, N: Math.exp(-lam * t), rk4: null, mc: restantes / nMC }
      if (i % CADA === 0) {
        row.rk4 = sol.zs[i / CADA][0]
        err = Math.max(err, Math.abs(row.rk4 - Math.exp(-lam * t)) / Math.exp(-lam * t))
      }
      data.push(row)
    }
    return { data, err }
  }, [lam, tFin, nMC, seed])

  const refs: RefLine[] = []
  for (let n = 1; n <= ciclos; n++) refs.push({ x: n * thalf, label: n === 1 ? "T½" : `${n}T½` })
  refs.push({ y: 0.5 })

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat label="λ = ln2 / T½" value={`${fmt(lam)} 1/${u.replace(/s$/, "")}`} />
        <Stat label="Vida media τ = 1/λ" value={`${fmt(1 / lam)} ${u}`} />
        <Stat label={`N/N₀ tras ${fmt(ciclos)} T½`} value={fmt(2 ** -ciclos, 4)} hint={`error relativo RK4 ${fmt(err)}`} />
        <Stat
          label={`Datación: queda ${fmt(frac * 100)} %`}
          value={`${fmt(Math.log(1 / frac) / lam)} ${u}`}
          hint="t = ln(N₀/N) / λ"
        />
      </StatGrid>
      <ChartCard
        title="Fracción de núcleos sin decaer"
        description={`Analítica, RK4 y una simulación Monte Carlo con ${nMC.toLocaleString("es-AR")} núcleos (cada núcleo decae con probabilidad 1 − e^(−λΔt) por paso)`}
      >
        <TimeChart
          data={data}
          series={[
            { key: "mc", label: `Monte Carlo (${nMC})`, color: "var(--chart-3)", type: "step", width: 1.5 },
            { key: "N", label: "N/N₀ analítica", color: "var(--chart-1)", width: 2.5 },
            { key: "rk4", label: "RK4", color: "var(--chart-2)", type: "dots" },
          ]}
          xLabel={`t [${u}]`}
          yLabel="N / N₀"
          yDomain={[0, 1]}
          refLines={refs}
        />
      </ChartCard>
    </div>
  )
}

export const decaimiento: Model = {
  id: "decaimiento",
  ejercicio: "Ej. 3",
  title: "Decaimiento radiactivo",
  description: "Desintegración de un isótopo y datación por carbono-14.",
  equation: String.raw`\frac{dN}{dt} = -\lambda\,N \;\Rightarrow\; N(t) = N_0\,e^{-\lambda t},\quad \lambda = \frac{\ln 2}{T_{1/2}}`,
  params: [
    {
      kind: "select",
      key: "isotopo",
      label: "Isótopo",
      options: [...Object.entries(ISOTOPOS).map(([value, i]) => ({ value, label: `${i.label} (${i.thalf} ${i.unidad})` })), { value: "custom", label: "Personalizado" }],
    },
    { key: "thalf", label: "Semidesintegración", symbol: "T_{1/2}", min: 1, max: 10000, step: 1 },
    { key: "ciclos", label: "Horizonte (en T½)", symbol: "t_f/T_{1/2}", min: 1, max: 10, step: 1, group: "Simulación" },
    { key: "nMC", label: "Núcleos Monte Carlo", symbol: "n", min: 10, max: 5000, step: 10, group: "Simulación" },
    { key: "seed", label: "Semilla aleatoria", symbol: "s", min: 0, max: 100, step: 1, group: "Simulación" },
    { key: "frac", label: "Fracción remanente", symbol: "N/N_0", min: 0.01, max: 0.99, step: 0.01, group: "Análisis" },
  ],
  defaults: { isotopo: "c14", thalf: 5730, ciclos: 5, nMC: 1000, seed: 0, frac: 0.3 },
  onChange: (key, value, p) => {
    if (key === "isotopo" && ISOTOPOS[String(value)]) return { ...p, thalf: ISOTOPOS[String(value)].thalf }
    if (key === "thalf") return { ...p, isotopo: "custom" }
    return p
  },
  teoria: TEORIA.decaimiento,
  View,
}
