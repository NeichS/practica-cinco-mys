"use client"

import { useState } from "react"
import { BookOpen, ChartNoAxesCombined, CircleHelp, Presentation, Sparkles } from "lucide-react"
import { MODELOS } from "@/components/models"
import type { Params } from "@/components/models/types"
import { ParamPanel } from "@/components/param-panel"
import { TeoriaCard } from "@/components/teoria-card"
import { Tex } from "@/components/tex"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const inicial = () => Object.fromEntries(MODELOS.map((m) => [m.id, { ...m.defaults }])) as Record<string, Params>

export default function Home() {
  const [activo, setActivo] = useState(MODELOS[0].id)
  const [params, setParams] = useState(inicial)
  const model = MODELOS.find((m) => m.id === activo)!
  const p = params[activo]

  const elegirModelo = (id: string) => {
    setActivo(id)
    requestAnimationFrame(() =>
      document.getElementById("modelo-activo")?.scrollIntoView({ behavior: "smooth", block: "start" })
    )
  }

  const cambiar = (key: string, value: Params[string]) =>
    setParams((prev) => {
      let next: Params = { ...prev[activo], [key]: value }
      if (model.onChange) next = model.onChange(key, value, next, prev[activo])
      return { ...prev, [activo]: next }
    })

  return (
    <div className="flex min-h-full flex-col bg-[linear-gradient(180deg,var(--presentation-wash)_0,transparent_22rem)]">
      <header className="sticky top-0 z-20 border-b bg-background/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ChartNoAxesCombined className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-semibold tracking-[-0.02em]">Modelos y Simulación</div>
              <div className="truncate text-xs text-muted-foreground">TP 5 · Ecuaciones diferenciales</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground md:flex">
              <Presentation className="size-3.5" aria-hidden="true" />
              5 modelos interactivos
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col gap-7 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <nav aria-label="Elegir modelo" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex min-w-max rounded-2xl bg-card p-1.5 shadow-[0_10px_30px_-22px_color-mix(in_oklch,var(--foreground),transparent_55%)] ring-1 ring-foreground/10 sm:min-w-[760px]" role="tablist">
            {MODELOS.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`tab-${m.id}`}
                aria-selected={m.id === activo}
                aria-controls="modelo-activo"
                onClick={() => elegirModelo(m.id)}
                className={cn(
                  "group flex min-w-[148px] flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left outline-none transition-[background,color,box-shadow] hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0",
                  m.id === activo && "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                )}
              >
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold tabular-nums text-muted-foreground", m.id === activo && "bg-primary-foreground/14 text-primary-foreground")}>
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-[11px] leading-none text-muted-foreground", m.id === activo && "text-primary-foreground/70")}>{m.ejercicio}</span>
                  <span className="mt-1 block truncate text-sm font-medium tracking-tight">{m.title}</span>
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="order-2 lg:order-none lg:sticky lg:top-23 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-2">
            <ParamPanel
              model={model}
              params={p}
              onChange={cambiar}
              onReset={() => setParams((prev) => ({ ...prev, [activo]: { ...model.defaults } }))}
            />
          </aside>

          <section className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-5">
            <Card
              id="modelo-activo"
              role="tabpanel"
              aria-labelledby={`tab-${model.id}`}
              className="model-intro order-1 scroll-mt-36 overflow-visible bg-[linear-gradient(135deg,var(--model-wash),var(--card)_58%)] lg:order-none"
            >
              <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)] md:items-center">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge>{model.ejercicio}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">Modelo {MODELOS.findIndex((m) => m.id === activo) + 1} de {MODELOS.length}</span>
                  </div>
                  <h1 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{model.title}</h1>
                  <p className="mt-2 max-w-[62ch] text-[0.95rem] leading-relaxed text-muted-foreground">{model.description}</p>
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-background/75 p-3 text-sm leading-relaxed ring-1 ring-primary/15">
                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <p><span className="font-medium text-foreground">Pregunta guía:</span> {model.question}</p>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto px-0 text-muted-foreground hover:text-foreground"
                    onClick={() => document.getElementById("explicacion")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <BookOpen /> Ir a la explicación paso a paso
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl bg-background/80 px-4 py-5 text-center text-[0.95rem] shadow-[0_8px_24px_-20px_var(--foreground)] ring-1 ring-foreground/10">
                  <Tex display>{model.equation}</Tex>
                </div>
              </CardContent>
            </Card>
            <div className="order-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between lg:order-none">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.02em]">Interpretá los resultados</h2>
                <p className="mt-1 text-sm text-muted-foreground">Los indicadores y gráficos responden al instante a cada ajuste.</p>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary sm:mt-0">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Cálculo en tiempo real
              </div>
            </div>
            <div key={model.id} className="model-results order-4 lg:order-none">
              <model.View p={p} set={(patch) => setParams((prev) => ({ ...prev, [activo]: { ...prev[activo], ...patch } }))} />
            </div>
            <div className="order-5 lg:order-none">
              <TeoriaCard id="explicacion" teoria={model.teoria} />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card/50 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground">
        Soluciones analíticas comparadas con Euler, RK4 y Monte Carlo · Cálculos ejecutados localmente en el navegador.
      </footer>
    </div>
  )
}
