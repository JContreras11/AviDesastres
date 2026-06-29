"use client"

import { cn } from "@/lib/utils"

// Plano (sin base-ui). value 0..100.
function Progress({ className, value = 0, "aria-label": ariaLabel }: { className?: string; value?: number; "aria-label"?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div data-slot="progress" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}
      className={cn("relative h-1 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full bg-primary transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export { Progress }
