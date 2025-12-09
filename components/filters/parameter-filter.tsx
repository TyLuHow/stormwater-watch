"use client"

import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Parameter {
  id: string
  name: string
  category?: string | null
  count?: number
}

interface ParameterFilterProps {
  parameters: Parameter[]
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  allowMultiple?: boolean
}

export function ParameterFilter({
  parameters,
  value,
  onChange,
  label = "Parameter",
  placeholder = "Select parameter...",
  className,
  allowMultiple = false,
}: ParameterFilterProps) {
  const [open, setOpen] = useState(false)

  // Group parameters by category
  const groupedParameters = useMemo(() => {
    const grouped: Record<string, Parameter[]> = {}

    parameters.forEach((param) => {
      const category = param.category || "Other"
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(param)
    })

    // Sort categories and parameters within each category
    const sortedGroups: Record<string, Parameter[]> = {}
    Object.keys(grouped)
      .sort()
      .forEach((category) => {
        sortedGroups[category] = grouped[category].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      })

    return sortedGroups
  }, [parameters])

  const selectedParameter = parameters.find((p) => p.id === value)

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedParameter ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">{selectedParameter.name}</span>
                {selectedParameter.category && (
                  <Badge variant="outline" className="text-xs">
                    {selectedParameter.category}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search parameters..." />
            <CommandList>
              <CommandEmpty>No parameters found.</CommandEmpty>
              {Object.entries(groupedParameters).map(([category, params]) => (
                <CommandGroup key={category} heading={category}>
                  {params.map((param) => (
                    <CommandItem
                      key={param.id}
                      value={param.name}
                      onSelect={() => {
                        onChange(param.id === value ? "" : param.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === param.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 truncate">
                        <div className="truncate">{param.name}</div>
                        {param.count !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            {param.count.toLocaleString()} samples
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
          {value && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
