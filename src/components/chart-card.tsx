import type { ReactNode } from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("shadow-[0_16px_38px_-34px_var(--foreground)]", className)}>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg tracking-[-0.02em]">{title}</CardTitle>
        {description && <CardDescription className="max-w-[75ch] leading-relaxed">{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
