import { Fragment } from "react"
import { Tex } from "@/components/tex"

/** Texto con matemática en línea entre $…$ y negritas entre **…**. */
export function RichText({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g).map((parte, i) => {
        if (parte.startsWith("$") && parte.endsWith("$")) return <Tex key={i}>{parte.slice(1, -1)}</Tex>
        if (parte.startsWith("**") && parte.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-foreground">
              {parte.slice(2, -2)}
            </strong>
          )
        return <Fragment key={i}>{parte}</Fragment>
      })}
    </>
  )
}
