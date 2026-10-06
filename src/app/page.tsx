"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"
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

  const cambiar = (key: string, value: Params[string]) =>
    setParams((prev) => {
      let next: Params = { ...prev[activo], [key]: value }
      if (model.onChange) next = model.onChange(key, value, next)
      return { ...prev, [activo]: next }
    })

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-semibold tracking-tight">Modelos y Simulación</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Trabajo Práctico 5 · Ecuaciones diferenciales</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <nav aria-label="Modelos" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="grid min-w-[720px] grid-cols-5 gap-2">
            {MODELOS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActivo(m.id)}
                aria-current={m.id === activo ? "page" : undefined}
                className={cn(
                  "group rounded-xl border bg-card px-3.5 py-3 text-left transition-all hover:border-foreground/20 hover:shadow-sm",
                  m.id === activo && "border-primary/60 bg-accent shadow-sm ring-1 ring-primary/20"
                )}
              >
                <div className="text-xs text-muted-foreground">{m.ejercicio}</div>
                <div className="mt-0.5 font-medium tracking-tight">{m.title}</div>
              </button>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pb-2">
            <ParamPanel
              model={model}
              params={p}
              onChange={cambiar}
              onReset={() => setParams((prev) => ({ ...prev, [activo]: { ...model.defaults } }))}
            />
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{model.ejercicio}</Badge>
                    <h1 className="text-xl font-semibold tracking-tight">{model.title}</h1>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{model.description}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto px-0"
                    onClick={() => document.getElementById("explicacion")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <BookOpen /> ¿Para qué sirve cada fórmula?
                  </Button>
                </div>
                <div className="overflow-x-auto text-[0.95rem]">
                  <Tex display>{model.equation}</Tex>
                </div>
              </CardContent>
            </Card>
            <model.View key={model.id} p={p} set={(patch) => setParams((prev) => ({ ...prev, [activo]: { ...prev[activo], ...patch } }))} />
            <TeoriaCard id="explicacion" teoria={model.teoria} />
          </section>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Soluciones analíticas comparadas con Euler, RK4 y Monte Carlo — calculadas en el navegador.
      </footer>
    </div>
  )
}
