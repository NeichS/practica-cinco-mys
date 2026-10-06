import { BookOpen, Eye } from "lucide-react"
import type { Teoria } from "@/components/models/types"
import { RichText } from "@/components/rich-text"
import { Tex } from "@/components/tex"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function TeoriaCard({ teoria, id }: { teoria: Teoria; id?: string }) {
  return (
    <Card id={id} className="scroll-mt-24 bg-[linear-gradient(145deg,var(--card),var(--model-wash))]">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          Explicá el modelo
        </CardTitle>
        <CardDescription className="max-w-[72ch] text-sm leading-relaxed">
          <RichText>{teoria.resumen}</RichText>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="mb-3 text-base font-semibold">Qué significa cada fórmula</h3>
          <div className="overflow-hidden rounded-xl bg-background/70 ring-1 ring-foreground/10">
            {teoria.formulas.map((f, i) => (
              <div key={f.nombre} className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[minmax(180px,0.65fr)_minmax(0,1fr)] md:items-center md:px-5">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="grid size-5 place-items-center rounded-md bg-primary/10 font-semibold tabular-nums text-primary">{i + 1}</span>
                    <span className="font-medium tracking-wide uppercase">{f.nombre}</span>
                  </div>
                  <div className="overflow-x-auto py-1 text-foreground">
                    <Tex display>{f.tex}</Tex>
                  </div>
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
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Eye className="size-4 text-primary" aria-hidden="true" /> Cómo leer los gráficos
          </h3>
          <ul className="grid gap-2.5 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            {teoria.lectura.map((l, i) => (
              <li key={i} className="flex gap-2.5 py-1">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
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
