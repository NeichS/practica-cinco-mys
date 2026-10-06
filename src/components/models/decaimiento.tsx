"use client"

import { useMemo } from "react"
import { ChartCard } from "@/components/chart-card"
import { Stat, StatGrid } from "@/components/stat"
import { TimeChart, type RefLine, type Series } from "@/components/time-chart"
import { binomial, fmt, rk4, rng } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

const N = 300
const CADA = 15
/** Fracciones iniciales C = N(0)/N₀ de la familia N = C·N₀·e^{−λt}. */
const FAMILIA_C = [0.2, 0.4, 0.6, 0.8]
const FAMILIA_T = [0.25, 0.5, 2, 4]
/** Cantidades de sustancia comparadas en los gráficos de actividad (múltiplos de N₀). */
const MUESTRAS = [
  { k: 0.5, label: "½·N₀", color: "var(--chart-2)" },
  { k: 1, label: "N₀", color: "var(--chart-1)" },
  { k: 2, label: "2·N₀", color: "var(--chart-3)" },
]

/** Unidades de tiempo disponibles, con su equivalencia en segundos. */
export const UNIDADES: Record<string, { label: string; singular: string; segundos: number }> = {
  segundos: { label: "segundos", singular: "s", segundos: 1 },
  minutos: { label: "minutos", singular: "min", segundos: 60 },
  horas: { label: "horas", singular: "h", segundos: 3600 },
  días: { label: "días", singular: "día", segundos: 86400 },
  años: { label: "años", singular: "año", segundos: 365.25 * 86400 },
}

export const ISOTOPOS: Record<string, { label: string; thalf: number; unidad: string }> = {
  c14: { label: "Carbono-14", thalf: 5730, unidad: "años" },
  cs137: { label: "Cesio-137", thalf: 30.17, unidad: "años" },
  co60: { label: "Cobalto-60", thalf: 5.27, unidad: "años" },
  i131: { label: "Yodo-131", thalf: 8.02, unidad: "días" },
}

const unidad = (p: Params) => String(p.unidad)

function View({ p }: { p: Params }) {
  const thalf = num(p, "thalf")
  const ciclos = num(p, "ciclos")
  const nMC = num(p, "nMC")
  const seed = num(p, "seed")
  const frac = num(p, "frac")
  const superponer = String(p.superponer)
  const N0 = num(p, "N0")
  const u = unidad(p)
  const us = UNIDADES[u]?.singular ?? u

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
      if (superponer === "c") FAMILIA_C.forEach((c, j) => (row[`f${j}`] = c * Math.exp(-lam * t)))
      if (superponer === "t") FAMILIA_T.forEach((m, j) => (row[`f${j}`] = Math.exp((-lam / m) * t)))
      if (i % CADA === 0) {
        row.rk4 = sol.zs[i / CADA][0]
        err = Math.max(err, Math.abs(row.rk4 - Math.exp(-lam * t)) / Math.exp(-lam * t))
      }
      data.push(row)
    }
    return { data, err }
  }, [lam, tFin, nMC, seed, superponer])

  const etiquetas =
    superponer === "c"
      ? FAMILIA_C.map((c) => `N(0) = ${c}·N₀`)
      : superponer === "t"
        ? FAMILIA_T.map((m) => `T½ = ${fmt(m * thalf)} ${u}`)
        : []
  const familia: Series[] = etiquetas.map((label, j) => ({
    key: `f${j}`,
    label,
    color: `var(--chart-${j + 2})`,
    width: 1.25,
    dashed: true,
  }))

  // Actividad A = λN: desintegraciones por unidad de tiempo
  const actividad = useMemo(() => {
    const temporal: Record<string, number | null>[] = []
    for (let i = 0; i <= 200; i++) {
      const t = (i * tFin) / 200
      const row: Record<string, number | null> = { t }
      MUESTRAS.forEach((m, j) => (row[`a${j}`] = lam * m.k * N0 * Math.exp(-lam * t)))
      temporal.push(row)
    }
    // A en función de N: recta por el origen; los puntos marcan el inicio de cada muestra
    const vsN: Record<string, number | null>[] = []
    for (let i = 0; i <= 40; i++) {
      const n = (i * 2.2 * N0) / 40
      vsN.push({ n, A: lam * n, p: null })
    }
    MUESTRAS.forEach((m) => vsN.push({ n: m.k * N0, A: null, p: lam * m.k * N0 }))
    vsN.sort((a, b) => Number(a.n) - Number(b.n))
    return { temporal, vsN }
  }, [lam, tFin, N0])

  const refs: RefLine[] = []
  for (let n = 1; n <= ciclos; n++) refs.push({ x: n * thalf, label: n === 1 ? "T½" : `${n}T½` })
  refs.push({ y: 0.5 })

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat label="λ = ln2 / T½" value={`${fmt(lam)} 1/${UNIDADES[u]?.singular ?? u}`} />
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
        description={
          superponer === "c"
            ? "Familia de soluciones N = C·e^(−λt): distinta cantidad inicial, mismo isótopo. Todas se reducen a la mitad en el mismo T½."
            : superponer === "t"
              ? "Mismo N₀ con distintos períodos de semidesintegración: cuanto mayor T½, más lento el decaimiento."
              : `Analítica, RK4 y una simulación Monte Carlo con ${nMC.toLocaleString("es-AR")} núcleos (cada núcleo decae con probabilidad 1 − e^(−λΔt) por paso)`
        }
      >
        <TimeChart
          data={data}
          series={
            familia.length
              ? // con la familia visible se ocultan RK4 y Monte Carlo para no repetir colores
                [...familia, { key: "N", label: "N/N₀ analítica", color: "var(--chart-1)", width: 2.5 }]
              : [
                  { key: "mc", label: `Monte Carlo (${nMC})`, color: "var(--chart-3)", type: "step", width: 1.5 },
                  { key: "N", label: "N/N₀ analítica", color: "var(--chart-1)", width: 2.5 },
                  { key: "rk4", label: "RK4", color: "var(--chart-2)", type: "dots" },
                ]
          }
          xLabel={`t [${u}]`}
          yLabel="N / N₀"
          yDomain={[0, 1]}
          refLines={refs}
        />
      </ChartCard>

      <StatGrid>
        <Stat label="Actividad inicial A₀ = λ·N₀" value={`${fmt(lam * N0)} /${us}`} hint={`desintegraciones por ${us} con ${fmt(N0)} núcleos`} />
        <Stat label="Con el doble de sustancia (2·N₀)" value={`${fmt(2 * lam * N0)} /${us}`} hint="el doble de desintegraciones" />
        <Stat label="A / N (para cualquier N)" value={`${fmt(lam)} /${us}`} hint="siempre λ: la proporción no cambia" />
        <Stat
          label={`Decae en 1 ${us}`}
          value={`${fmt((1 - Math.exp(-lam)) * 100)} %`}
          hint="de lo que haya, sea mucho o poco"
        />
      </StatGrid>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Desintegraciones por unidad de tiempo"
          description={`Actividad A(t) = λ·N(t) para tres cantidades de sustancia. Más sustancia → más desintegraciones por ${us}, y cada curva baja a la mitad en el mismo T½.`}
        >
          <TimeChart
            data={actividad.temporal}
            series={MUESTRAS.map((m, j) => ({ key: `a${j}`, label: `A con ${m.label}`, color: m.color, width: m.k === 1 ? 2.5 : 1.75 }))}
            xLabel={`t [${u}]`}
            yLabel={`A [1/${us}]`}
            refLines={[{ x: thalf, label: "T½" }]}
            className="aspect-[6/5] w-full"
          />
        </ChartCard>
        <ChartCard
          title="Actividad en función de los núcleos"
          description="A = λ·N es una recta que pasa por el origen con pendiente λ: duplicar N duplica A. Los puntos son las tres muestras al inicio."
        >
          <TimeChart
            data={actividad.vsN}
            xKey="n"
            series={[
              { key: "A", label: "A = λ·N", color: "var(--chart-1)", width: 2.5 },
              { key: "p", label: "½·N₀, N₀ y 2·N₀", color: "var(--chart-2)", type: "dots" },
            ]}
            xLabel="N (núcleos)"
            yLabel={`A [1/${us}]`}
            className="aspect-[6/5] w-full"
          />
        </ChartCard>
      </div>
    </div>
  )
}

export const decaimiento: Model = {
  id: "decaimiento",
  ejercicio: "Ej. 3",
  title: "Decaimiento radiactivo",
  description: "Desintegración de un isótopo y datación por carbono-14.",
  question: "¿Cómo conectan la vida media, la datación y el comportamiento aleatorio de los núcleos?",
  equation: String.raw`\frac{dN}{dt} = -\lambda\,N \;\Rightarrow\; N(t) = N_0\,e^{-\lambda t},\quad \lambda = \frac{\ln 2}{T_{1/2}}`,
  params: [
    {
      kind: "select",
      key: "isotopo",
      label: "Isótopo",
      options: [...Object.entries(ISOTOPOS).map(([value, i]) => ({ value, label: `${i.label} (${i.thalf} ${i.unidad})` })), { value: "custom", label: "Personalizado" }],
    },
    { key: "thalf", label: "Semidesintegración", symbol: "T_{1/2}", unit: (p) => UNIDADES[unidad(p)]?.singular ?? "", min: 0.01, max: 10000, step: 0.01 },
    {
      kind: "select",
      key: "unidad",
      label: "Unidad de tiempo",
      options: Object.entries(UNIDADES).map(([value, u]) => ({ value, label: u.label })),
    },
    { key: "ciclos", label: "Horizonte (en T½)", symbol: "t_f/T_{1/2}", min: 1, max: 10, step: 1, group: "Simulación" },
    { key: "nMC", label: "Núcleos Monte Carlo", symbol: "n", min: 10, max: 5000, step: 10, group: "Simulación" },
    { key: "seed", label: "Semilla aleatoria", symbol: "s", min: 0, max: 100, step: 1, group: "Simulación" },
    { key: "frac", label: "Fracción remanente", symbol: "N/N_0", min: 0.01, max: 0.99, step: 0.01, group: "Análisis" },
    { key: "N0", label: "Núcleos iniciales", symbol: "N_0", min: 100, max: 100000, step: 100, group: "Análisis" },
    {
      kind: "select",
      key: "superponer",
      label: "Superponer curvas",
      group: "Análisis",
      options: [
        { value: "ninguna", label: "Ninguna" },
        { value: "c", label: "Familia de soluciones (distintas N(0))" },
        { value: "t", label: "Familia de T½ (¼ … 4 veces)" },
      ],
    },
  ],
  defaults: { isotopo: "c14", thalf: 5730, unidad: "años", ciclos: 5, nMC: 1000, seed: 0, frac: 0.3, N0: 10000, superponer: "ninguna" },
  onChange: (key, value, p, previo) => {
    if (key === "isotopo" && ISOTOPOS[String(value)]) {
      const iso = ISOTOPOS[String(value)]
      return { ...p, thalf: iso.thalf, unidad: iso.unidad }
    }
    // cambiar la unidad convierte T½: el isótopo es el mismo, solo se expresa distinto
    if (key === "unidad") {
      const previa = UNIDADES[String(previo.unidad)]
      const nueva = UNIDADES[String(value)]
      if (previa && nueva) return { ...p, thalf: Number(((num(p, "thalf") * previa.segundos) / nueva.segundos).toPrecision(6)) }
    }
    if (key === "thalf") return { ...p, isotopo: "custom" }
    return p
  },
  teoria: TEORIA.decaimiento,
  View,
}
