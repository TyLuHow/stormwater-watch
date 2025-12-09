"use client"

import { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Facility {
  id: string | number
  name: string
  region?: string
  county?: string
}

interface FacilitySearchProps {
  facilities: Facility[]
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  showQuickSearch?: boolean
}

export function FacilitySearch({
  facilities,
  value,
  onChange,
  label = "Facility",
  placeholder = "Search facility...",
  className,
  showQuickSearch = true,
}: FacilitySearchProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter facilities based on search
  const filteredFacilities = facilities.filter((facility) => {
    if (!debouncedSearch) return true
    return facility.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  })

  const selectedFacility = facilities.find((f) => f.id.toString() === value)

  const handleSelect = useCallback(
    (facilityId: string) => {
      onChange(facilityId === value ? "" : facilityId)
      setOpen(false)
      setSearchTerm("")
    },
    [value, onChange]
  )

  const handleClear = useCallback(() => {
    onChange("")
    setSearchTerm("")
    setOpen(false)
  }, [onChange])

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {showQuickSearch ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9"
          />
          {(searchTerm || value) && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedFacility ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{selectedFacility.name}</span>
                  {selectedFacility.region && (
                    <Badge variant="outline" className="text-xs">
                      {selectedFacility.region}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search facilities..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No facilities found.</CommandEmpty>
                <CommandGroup>
                  {filteredFacilities.slice(0, 100).map((facility) => (
                    <CommandItem
                      key={facility.id}
                      value={facility.name}
                      onSelect={() => handleSelect(facility.id.toString())}
                    >
                      <div className="flex-1 truncate">
                        <div className="truncate">{facility.name}</div>
                        {(facility.region || facility.county) && (
                          <div className="text-xs text-muted-foreground">
                            {facility.region || facility.county}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {value && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Display selected facility */}
      {selectedFacility && showQuickSearch && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
          <div className="flex-1 truncate text-sm">
            <div className="truncate font-medium">{selectedFacility.name}</div>
            {(selectedFacility.region || selectedFacility.county) && (
              <div className="text-xs text-muted-foreground">
                {selectedFacility.region || selectedFacility.county}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
