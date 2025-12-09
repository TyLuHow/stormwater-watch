"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  title?: string
  description?: string
  children: ReactNode
  onClearAll?: () => void
  activeFilterCount?: number
  className?: string
  collapsible?: boolean
}

export function FilterBar({
  title = "Filters",
  description,
  children,
  onClearAll,
  activeFilterCount = 0,
  className,
  collapsible = false,
}: FilterBarProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount} active
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {onClearAll && activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
