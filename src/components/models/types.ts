import type { ComponentType } from "react"

export type Params = Record<string, number | boolean | string>

export type ParamDef =
  | {
      kind?: "slider"
      key: string
      label: string
      symbol?: string
      /** Unidad fija o calculada a partir de los demás parámetros. */
      unit?: string | ((p: Params) => string)
      min: number
      max: number
      step: number
      group?: string
    }
  | { kind: "switch"; key: string; label: string; group?: string }
  | {
      kind: "select"
      key: string
      label: string
      options: { value: string; label: string }[]
      group?: string
    }

export type Preset = { label: string; values: Params }

export type Formula = {
  nombre: string
  /** Fórmula en LaTeX. */
  tex: string
  /** Para qué sirve. Admite matemática en línea entre $…$. */
  texto: string
}

export type Teoria = {
  /** Qué fenómeno modela la ecuación. Admite $…$. */
  resumen: string
  formulas: Formula[]
  /** Cómo leer los gráficos de la simulación. Admite $…$. */
  lectura: string[]
}

export type Model = {
  id: string
  ejercicio: string
  title: string
  description: string
  /** Pregunta guía para presentar e interpretar el modelo. */
  question: string
  equation: string
  params: ParamDef[]
  defaults: Params
  presets?: Preset[]
  /** Ajustes derivados al cambiar un parámetro (p.ej. elegir isótopo fija T½). */
  onChange?: (key: string, value: Params[string], p: Params, previo: Params) => Params
  teoria: Teoria
  View: ComponentType<{ p: Params; set: (patch: Params) => void }>
}

export const num = (p: Params, k: string) => Number(p[k])
