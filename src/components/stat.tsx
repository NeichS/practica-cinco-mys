import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border lg:grid-cols-4">{children}</div>
}

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-24 flex-col justify-center bg-card px-4 py-3.5", className)}>
      <div className="text-xs leading-snug text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums tracking-[-0.03em]">{value}</div>
      {hint && <div className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</div>}
    </div>
  )
}
