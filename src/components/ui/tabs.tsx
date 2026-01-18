'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TabsComponent({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div data-default={defaultValue} className={className}>
      {children}
    </div>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <button
      data-value={value}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div data-value={value} className={className}>
      {children}
    </div>
  )
}

export const Tabs = TabsComponent
