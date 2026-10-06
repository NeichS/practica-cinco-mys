import type { Mat2 } from "@/lib/ode"

/** Diagrama en bloques de x' = a11 x + a12 y, y' = a21 x + a22 y (port de ej4_diagramas_bloques.py). */
const U = 64
const X0 = -0.3
const Y1 = 4.8
const sx = (x: number) => (x - X0) * U
const sy = (y: number) => (Y1 - y) * U

function Flecha({ pts }: { pts: [number, number][] }) {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x)},${sy(y)}`).join("")
  return <path d={d} fill="none" className="stroke-foreground" strokeWidth={1.5} markerEnd="url(#bd-arrow)" />
}

function Caja({ x, y, w, h, texto, tono }: { x: number; y: number; w: number; h: number; texto: string; tono: "int" | "propia" | "cruz" }) {
  const fill = tono === "int" ? "var(--chart-1)" : tono === "propia" ? "var(--chart-2)" : "var(--chart-3)"
  return (
    <g>
      <rect x={sx(x - w / 2)} y={sy(y + h / 2)} width={w * U} height={h * U} rx={8} fill={fill} fillOpacity={0.15} stroke={fill} strokeWidth={1.5} />
      <text x={sx(x)} y={sy(y) + 5} textAnchor="middle" className="fill-foreground font-mono text-[14px]">
        {texto}
      </text>
    </g>
  )
}

function Sumador({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={sx(x)} cy={sy(y)} r={0.25 * U} className="fill-background stroke-foreground" strokeWidth={1.5} />
      <text x={sx(x)} y={sy(y) + 6} textAnchor="middle" className="fill-foreground text-[16px]">
        Σ
      </text>
    </g>
  )
}

const Nodo = ({ x, y }: { x: number; y: number }) => <circle cx={sx(x)} cy={sy(y)} r={4} className="fill-foreground" />

export function BlockDiagram({ A }: { A: Mat2 }) {
  const [[a11, a12], [a21, a22]] = A
  const yx = 3
  const yy = 0
  const r = 0.25
  const g = (v: number) => String(Number(v.toFixed(3)))
  return (
    <svg viewBox={`0 0 ${7.4 * U} ${6.6 * U}`} className="w-full" role="img" aria-label="Diagrama en bloques">
      <defs>
        <marker id="bd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-foreground" />
        </marker>
      </defs>
      {a11 !== 0 && (
        <>
          <Flecha pts={[[4.8, yx], [4.8, yx + 1.2], [1, yx + 1.2], [1, yx + r]]} />
          <Nodo x={4.8} y={yx} />
          <Caja x={3} y={yx + 1.2} w={0.9} h={0.5} texto={g(a11)} tono="propia" />
        </>
      )}
      {a22 !== 0 && (
        <>
          <Flecha pts={[[4.8, yy], [4.8, yy - 1.2], [1, yy - 1.2], [1, yy - r]]} />
          <Nodo x={4.8} y={yy} />
          <Caja x={3} y={yy - 1.2} w={0.9} h={0.5} texto={g(a22)} tono="propia" />
        </>
      )}
      {a21 !== 0 && (
        <>
          <Flecha pts={[[5.2, yx], [5.2, 2], [0.2, 2], [0.2, yy], [1 - r, yy]]} />
          <Nodo x={5.2} y={yx} />
          <Caja x={3} y={2} w={0.9} h={0.5} texto={g(a21)} tono="cruz" />
        </>
      )}
      {a12 !== 0 && (
        <>
          <Flecha pts={[[5.6, yy], [5.6, 1], [1, 1], [1, yx - r]]} />
          <Nodo x={5.6} y={yy} />
          <Caja x={3} y={1} w={0.9} h={0.5} texto={g(a12)} tono="cruz" />
        </>
      )}
      {[
        [yx, "x", "ẋ"],
        [yy, "y", "ẏ"],
      ].map(([fila, v, d]) => (
        <g key={v as string}>
          <Flecha pts={[[1 + r, fila as number], [2.5, fila as number]]} />
          <text x={sx(1.85)} y={sy((fila as number) + 0.14)} textAnchor="middle" className="fill-foreground text-[14px] italic">
            {d}
          </text>
          <Caja x={3} y={fila as number} w={1} h={0.6} texto="∫ dt" tono="int" />
          <Flecha pts={[[3.5, fila as number], [6.4, fila as number]]} />
          <text x={sx(6.5)} y={sy(fila as number) + 5} className="fill-foreground text-[15px] italic">
            {v}(t)
          </text>
          <Sumador x={1} y={fila as number} />
        </g>
      ))}
    </svg>
  )
}
