"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Tabs planos (sin base-ui). base-ui Tabs disparaba re-render storms/freeze con React 19.
const TabsCtx = React.createContext<{ value: string; setValue: (v: string) => void; baseId: string }>({
  value: "",
  setValue: () => {},
  baseId: "",
})
// ids estables para enlazar tab <-> panel (aria-controls / aria-labelledby).
const tabId = (base: string, v: string) => `${base}-tab-${v}`
const panelId = (base: string, v: string) => `${base}-panel-${v}`

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
  children?: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const val = value ?? internal
  const setValue = React.useCallback(
    (v: string) => (onValueChange ? onValueChange(v) : setInternal(v)),
    [onValueChange],
  )
  const baseId = React.useId()
  return (
    <TabsCtx.Provider value={{ value: val, setValue, baseId }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

function TabsList({ className, children }: { className?: string; children?: React.ReactNode }) {
  // Navegación por teclado del patrón tablist (flechas/Home/End, activación automática).
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'))
    const i = tabs.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    let j = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length
    else if (e.key === "Home") j = 0
    else if (e.key === "End") j = tabs.length - 1
    if (j < 0) return
    e.preventDefault()
    tabs[j].focus()
    tabs[j].click()
  }
  return (
    <div role="tablist" data-slot="tabs-list" onKeyDown={onKeyDown}
      className={cn("inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children?: React.ReactNode }) {
  const { value: active, setValue, baseId } = React.useContext(TabsCtx)
  const on = active === value
  return (
    // role=tab + aria-controls/id; tabindex rotativo (solo el activo es tabbable); foco VISIBLE.
    <button type="button" role="tab" aria-selected={on} data-state={on ? "active" : "inactive"}
      id={tabId(baseId, value)} aria-controls={panelId(baseId, value)} tabIndex={on ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        className,
      )}>
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }: { value: string; className?: string; children?: React.ReactNode }) {
  const { value: active, baseId } = React.useContext(TabsCtx)
  if (active !== value) return null
  // tabindex=0 + aria-labelledby: el panel es alcanzable por teclado y anunciado por su tab.
  return <div role="tabpanel" id={panelId(baseId, value)} aria-labelledby={tabId(baseId, value)} tabIndex={0}
    data-slot="tabs-content" className={cn("flex-1 text-sm outline-none", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
