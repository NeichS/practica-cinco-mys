export type Vec = number[]
export type Deriv = (t: number, z: Vec) => Vec

const axpy = (a: number, x: Vec, y: Vec) => y.map((yi, i) => yi + a * x[i])

/** Euler explícito con paso fijo h. Devuelve n+1 puntos en [0, tFin]. */
export function euler(f: Deriv, z0: Vec, tFin: number, h: number) {
  const n = Math.max(1, Math.round(tFin / h))
  const ts: number[] = [0]
  const zs: Vec[] = [z0]
  let z = z0
  for (let i = 0; i < n; i++) {
    const t = i * h
    z = axpy(h, f(t, z), z)
    ts.push(t + h)
    zs.push(z)
  }
  return { ts, zs }
}

/** Runge-Kutta clásico de orden 4 con paso fijo h. */
export function rk4(f: Deriv, z0: Vec, tFin: number, h: number) {
  const n = Math.max(1, Math.round(tFin / h))
  const ts: number[] = [0]
  const zs: Vec[] = [z0]
  let z = z0
  for (let i = 0; i < n; i++) {
    const t = i * h
    const k1 = f(t, z)
    const k2 = f(t + h / 2, axpy(h / 2, k1, z))
    const k3 = f(t + h / 2, axpy(h / 2, k2, z))
    const k4 = f(t + h, axpy(h, k3, z))
    z = z.map((zi, j) => zi + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]))
    ts.push(t + h)
    zs.push(z)
  }
  return { ts, zs }
}

export const linspace = (a: number, b: number, n: number) =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))

/** Generador pseudoaleatorio reproducible (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Muestra de Binomial(n, p) por suma de Bernoulli (n chico) o aproximación normal. */
export function binomial(n: number, p: number, rand: () => number) {
  if (n < 200) {
    let k = 0
    for (let i = 0; i < n; i++) if (rand() < p) k++
    return k
  }
  const u = Math.max(rand(), 1e-12)
  const v = rand()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.min(n, Math.max(0, Math.round(n * p + z * Math.sqrt(n * p * (1 - p)))))
}

export type Mat2 = [[number, number], [number, number]]

export function eig2(A: Mat2) {
  const [[a, b], [c, d]] = A
  const tr = a + d
  const det = a * d - b * c
  const disc = tr * tr - 4 * det
  if (disc >= 0) {
    const s = Math.sqrt(disc)
    const l1 = (tr + s) / 2
    const l2 = (tr - s) / 2
    const vec = (l: number): [number, number] => {
      // (A - lI) v = 0
      let v: [number, number] = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : l === a ? [1, 0] : [0, 1]
      const nrm = Math.hypot(v[0], v[1]) || 1
      v = [v[0] / nrm, v[1] / nrm]
      return v
    }
    const vecs = [vec(l1)]
    if (Math.abs(l1 - l2) > 1e-12) vecs.push(vec(l2))
    else if (Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) vecs.push(vecs[0][0] ? [0, 1] : [1, 0])
    return { tr, det, disc, re: [l1, l2], im: [0, 0], vecs }
  }
  const im = Math.sqrt(-disc) / 2
  return { tr, det, disc, re: [tr / 2, tr / 2], im: [im, -im], vecs: [] as [number, number][] }
}

export function clasificar(tr: number, det: number, disc: number) {
  const eps = 1e-9
  if (Math.abs(det) < eps) return "no aislado (det = 0): recta de equilibrios"
  if (det < 0) return "punto silla (inestable)"
  if (Math.abs(tr) < eps) return "centro (estable, no asintótico)"
  const estab = tr < 0 ? "estable" : "inestable"
  if (disc < -eps) return `foco/espiral ${estab}`
  if (Math.abs(disc) < eps) return `nodo impropio (degenerado) ${estab}`
  return `nodo ${estab}`
}

export function fmt(x: number, digits = 3) {
  if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "—"
  if (x === 0) return "0"
  const a = Math.abs(x)
  if (a >= 1e5 || a < 1e-3) return x.toExponential(2).replace("e+", "e")
  return Number(x.toPrecision(digits)).toLocaleString("es-AR", { maximumFractionDigits: 6 })
}
