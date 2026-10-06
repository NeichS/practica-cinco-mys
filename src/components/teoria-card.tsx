import { BookOpen, Eye } from "lucide-react"
import type { Teoria } from "@/components/models/types"
import { RichText } from "@/components/rich-text"
import { Tex } from "@/components/tex"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function TeoriaCard({ teoria, id }: { teoria: Teoria; id?: string }) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" /> Explicación
        </CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-relaxed">
          <RichText>{teoria.resumen}</RichText>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="mb-3 text-sm font-medium">¿Para qué sirve cada fórmula?</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {teoria.formulas.map((f, i) => (
              <div key={f.nombre} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium tracking-wide uppercase">{f.nombre}</span>
                </div>
                <div className="overflow-x-auto py-1 text-foreground">
                  <Tex display>{f.tex}</Tex>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <RichText>{f.texto}</RichText>
                </p>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Eye className="size-4 text-muted-foreground" /> Cómo leer los gráficos
          </h3>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            {teoria.lectura.map((l, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>
                  <RichText>{l}</RichText>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
