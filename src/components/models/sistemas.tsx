"use client"

import { useMemo } from "react"
import { BlockDiagram } from "@/components/block-diagram"
import { ChartCard } from "@/components/chart-card"
import { PhasePlane, type Trajectory } from "@/components/phase-plane"
import { Stat, StatGrid } from "@/components/stat"
import { Tex } from "@/components/tex"
import { TimeChart } from "@/components/time-chart"
import { Badge } from "@/components/ui/badge"
import { clasificar, eig2, euler, fmt, rk4, type Mat2 } from "@/lib/ode"
import { TEORIA } from "./teoria"
import { num, type Model, type Params } from "./types"

export const SISTEMAS: Record<string, Mat2> = {
  a: [[1, 2], [-5, 2]],
  b: [[-2, 0], [0, -3]],
  c: [[-3, 2], [-1, 0]],
  d: [[10, -18], [6, -11]],
  e: [[0, -1], [1, -2]],
  f: [[0, 1], [0, -1]],
}

const N = 300
const LIM = 3

/** Solución exacta x(t) = e^{At} x0 para A 2x2 (fórmula cerrada de la exponencial matricial). */
function expAt(A: Mat2, t: number, z0: [number, number]): [number, number] {
  const s = (A[0][0] + A[1][1]) / 2
  const B: Mat2 = [[A[0][0] - s, A[0][1]], [A[1][0], A[1][1] - s]]
  const delta = -(B[0][0] * B[1][1] - B[0][1] * B[1][0]) // B² = delta·I
  let C: number, S: number
  if (delta > 1e-12) {
    const m = Math.sqrt(delta)
    C = Math.cosh(m * t)
    S = Math.sinh(m * t) / m
  } else if (delta < -1e-12) {
    const w = Math.sqrt(-delta)
    C = Math.cos(w * t)
    S = Math.sin(w * t) / w
  } else {
    C = 1
    S = t
  }
  const e = Math.exp(s * t)
  return [
    e * (C * z0[0] + S * (B[0][0] * z0[0] + B[0][1] * z0[1])),
    e * (C * z0[1] + S * (B[1][0] * z0[0] + B[1][1] * z0[1])),
  ]
}

const matriz = (p: Params): Mat2 => [
  [num(p, "a11"), num(p, "a12")],
  [num(p, "a21"), num(p, "a22")],
]

function termino(c1: number, c2: number) {
  const partes: string[] = []
  for (const [c, v] of [[c1, "x"], [c2, "y"]] as const) {
    if (c === 0) continue
    const coef = Math.abs(c) === 1 ? "" : String(Math.abs(c))
    partes.push(`${c < 0 ? "-" : partes.length ? "+" : ""}${coef}${v}`)
  }
  return partes.join(" ") || "0"
}

function View({ p, set }: { p: Params; set: (patch: Params) => void }) {
  const A = matriz(p)
  const z0: [number, number] = [num(p, "x0"), num(p, "y0")]
  const tFin = num(p, "tFin")
  const h = num(p, "h")
  const f = (_: number, [x, y]: number[]) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y]
  const key = JSON.stringify(A)

  const ev = eig2(A)
  const tipo = clasificar(ev.tr, ev.det, ev.disc)

  const { data, err } = useMemo(() => {
    const dt = tFin / N
    const sim = euler(f, z0, tFin, h)
    const cada = Math.max(1, Math.round(sim.ts.length / 25))
    const rows = Array.from({ length: N + 1 }, (_, i) => {
      const t = i * dt
      const [x, y] = expAt(A, t, z0)
      return { t, x, y } as Record<string, number | null>
    })
    let err = 0
    let escala = 1e-12
    sim.ts.forEach((t, i) => {
      const [x, y] = expAt(A, t, z0)
      escala = Math.max(escala, Math.abs(x), Math.abs(y))
      err = Math.max(err, Math.abs(sim.zs[i][0] - x), Math.abs(sim.zs[i][1] - y))
      if (i % cada === 0) rows.push({ t, xd: sim.zs[i][0], yd: sim.zs[i][1] })
    })
    rows.sort((a, b) => Number(a.t) - Number(b.t))
    return { data: rows, err: err / escala }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, z0[0], z0[1], tFin, h])

  const familia = String(p.familia)
  const trayectorias = useMemo(() => {
    const out: Trajectory[] = []
    const prueba = (z: [number, number], hacia: 1 | -1, t: number) => {
      const s = rk4((tt, zz) => f(tt, zz).map((v) => hacia * v), z, t, 0.01)
      out.push({ pts: s.zs.map(([x, y]) => [x, y]), color: "var(--chart-2)", width: 1.25, opacity: 0.55 })
    }
    if (familia === "circulo")
      for (let k = 0; k < 8; k++) {
        const ang = (2 * Math.PI * k) / 8
        prueba([2.5 * Math.cos(ang), 2.5 * Math.sin(ang)], 1, 4)
      }
    if (familia === "grilla")
      // cada punto de la grilla se integra hacia adelante y hacia atrás para ver la curva completa
      for (const x of [-2.4, -1.2, 0, 1.2, 2.4])
        for (const y of [-1.8, -0.6, 0.6, 1.8]) {
          prueba([x, y], 1, 3)
          prueba([x, y], -1, 3)
        }
    const back = rk4((t, z) => f(t, z).map((v) => -v), z0, 1.5, 0.01)
    out.push({ pts: back.zs.map(([x, y]) => [x, y]), color: "var(--chart-1)", width: 1.5, dashed: true, opacity: 0.6 })
    const fwd = rk4(f, z0, tFin, 0.005)
    out.push({ pts: fwd.zs.map(([x, y]) => [x, y]), color: "var(--chart-1)", width: 2.75 })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, z0[0], z0[1], tFin, familia])

  const autovalores = ev.im[0]
    ? `${fmt(ev.re[0])} ± ${fmt(Math.abs(ev.im[0]))}i`
    : `${fmt(ev.re[0])}, ${fmt(ev.re[1])}`
  const yMax = Math.max(...data.map((r) => Math.max(Math.abs(Number(r.x ?? 0)), Math.abs(Number(r.y ?? 0)))))

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <Stat label="Autovalores λ₁, λ₂" value={autovalores} hint={ev.im[0] ? "complejos conjugados" : "reales"} />
        <Stat label="Traza / determinante" value={`${fmt(ev.tr)} / ${fmt(ev.det)}`} hint={`Δ = tr² − 4det = ${fmt(ev.disc)}`} />
        <Stat label="Equilibrio (0, 0)" value={<Badge variant="secondary" className="h-auto text-sm whitespace-normal">{tipo}</Badge>} className="col-span-2" />
      </StatGrid>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Diagrama en bloques"
          description={
            <Tex>{`\\dot x = ${termino(A[0][0], A[0][1])},\\quad \\dot y = ${termino(A[1][0], A[1][1])}`}</Tex>
          }
        >
          <BlockDiagram A={A} />
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-chart-1" /> integradores</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-chart-2" /> realimentación propia (a₁₁, a₂₂)</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-chart-3" /> acoplamiento cruzado (a₁₂, a₂₁)</span>
          </div>
        </ChartCard>
        <ChartCard
          title="Plano de fase"
          description={`Campo de direcciones${
            familia === "circulo"
              ? ", familia de trayectorias desde un círculo de radio 2.5"
              : familia === "grilla"
                ? ", familia de trayectorias por una grilla de puntos"
                : ""
          }, autovectores reales (punteado) y la trayectoria de (x₀, y₀)`}
        >
          <PhasePlane
            xDomain={[-LIM, LIM]}
            yDomain={[-LIM * 0.8333, LIM * 0.8333]}
            field={(x, y) => f(0, [x, y]) as [number, number]}
            trajectories={trayectorias}
            lines={ev.vecs.map((d) => ({ dir: d }))}
            markers={[{ x: 0, y: 0 }, { x: z0[0], y: z0[1], shape: "ring", color: "var(--chart-1)" }]}
            onPick={(x, y) => set({ x0: x, y0: y })}
          />
        </ChartCard>
      </div>
      <ChartCard
        title="Respuesta temporal"
        description={`Líneas: solución analítica e^{At}·x₀ · puntos: simulación del diagrama con integradores de Euler (h = ${h}), error relativo máx. ${fmt(err)}`}
      >
        <TimeChart
          data={data}
          series={[
            { key: "x", label: "x(t)", color: "var(--chart-1)", width: 2.5 },
            { key: "y", label: "y(t)", color: "var(--chart-3)", width: 2.5 },
            { key: "xd", label: "x diagrama", color: "var(--chart-1)", type: "dots" },
            { key: "yd", label: "y diagrama", color: "var(--chart-3)", type: "dots" },
          ]}
          xLabel="t"
          yDomain={yMax > 1e4 ? [-1e4, 1e4] : undefined}
        />
      </ChartCard>
    </div>
  )
}

export const sistemas: Model = {
  id: "sistemas",
  ejercicio: "Ej. 4",
  title: "Sistemas lineales 2×2",
  description: "Diagramas en bloques, autovalores y clasificación del equilibrio.",
  question: "¿Qué revela la matriz A sobre la estabilidad y la forma de las trayectorias?",
  equation: String.raw`\begin{pmatrix}\dot x\\ \dot y\end{pmatrix} = \begin{pmatrix}a_{11} & a_{12}\\ a_{21} & a_{22}\end{pmatrix}\begin{pmatrix}x\\ y\end{pmatrix}`,
  params: [
    {
      kind: "select",
      key: "sistema",
      label: "Sistema del práctico",
      options: [
        ...Object.entries(SISTEMAS).map(([k, A]) => ({ value: k, label: `(${k})  ẋ = ${termino(...A[0])},  ẏ = ${termino(...A[1])}` })),
        { value: "custom", label: "Personalizado" },
      ],
    },
    { key: "a11", label: "coef. de x en ẋ", symbol: "a_{11}", min: -20, max: 20, step: 0.5, group: "Matriz A" },
    { key: "a12", label: "coef. de y en ẋ", symbol: "a_{12}", min: -20, max: 20, step: 0.5, group: "Matriz A" },
    { key: "a21", label: "coef. de x en ẏ", symbol: "a_{21}", min: -20, max: 20, step: 0.5, group: "Matriz A" },
    { key: "a22", label: "coef. de y en ẏ", symbol: "a_{22}", min: -20, max: 20, step: 0.5, group: "Matriz A" },
    { key: "x0", label: "x inicial", symbol: "x_0", min: -3, max: 3, step: 0.05, group: "Condición inicial" },
    { key: "y0", label: "y inicial", symbol: "y_0", min: -2.5, max: 2.5, step: 0.05, group: "Condición inicial" },
    { key: "tFin", label: "Tiempo de simulación", symbol: "t_f", min: 0.5, max: 15, step: 0.5, group: "Simulación" },
    { key: "h", label: "Paso de Euler del diagrama", symbol: "h", min: 0.0005, max: 0.1, step: 0.0005, group: "Simulación" },
    {
      kind: "select",
      key: "familia",
      label: "Familia de trayectorias (plano de fase)",
      group: "Simulación",
      options: [
        { value: "circulo", label: "Desde un círculo (8)" },
        { value: "grilla", label: "Grilla densa (20, ida y vuelta)" },
        { value: "ninguna", label: "Ocultar" },
      ],
    },
  ],
  defaults: { sistema: "a", a11: 1, a12: 2, a21: -5, a22: 2, x0: 1, y0: -1, tFin: 3, h: 0.001, familia: "circulo" },
  onChange: (key, value, p) => {
    if (key === "sistema" && SISTEMAS[String(value)]) {
      const [[a11, a12], [a21, a22]] = SISTEMAS[String(value)]
      const inestable = eig2(SISTEMAS[String(value)]).re.some((r) => r > 0)
      return { ...p, a11, a12, a21, a22, tFin: inestable ? 3 : 6 }
    }
    if (/^a\d\d$/.test(key)) {
      const A = matriz(p)
      const match = Object.entries(SISTEMAS).find(([, S]) => JSON.stringify(S) === JSON.stringify(A))
      return { ...p, sistema: match ? match[0] : "custom" }
    }
    return p
  },
  teoria: TEORIA.sistemas,
  View,
}
