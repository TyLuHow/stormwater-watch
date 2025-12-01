"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FlaskConical, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatNumber } from "@/lib/utils"
import type { ParametersByCategory } from "@/lib/api/esmr"

export default function ParametersPage() {
  const [parameters, setParameters] = useState<ParametersByCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchParameters() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/esmr/parameters?groupByCategory=true')
        if (!res.ok) throw new Error('Failed to fetch parameters')

        const data = await res.json()
        setParameters(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parameters')
      } finally {
        setLoading(false)
      }
    }

    fetchParameters()
  }, [])

  // Calculate total parameters and samples
  const totalStats = parameters
    ? Object.values(parameters).reduce(
        (acc, params) => {
          acc.parameters += params.length
          acc.samples += params.reduce((sum, p) => sum + p.sampleCount, 0)
          return acc
        },
        { parameters: 0, samples: 0 }
      )
    : { parameters: 0, samples: 0 }

  // Sort categories by total sample count
  const sortedCategories = parameters
    ? Object.entries(parameters).sort((a, b) => {
        const aTotal = a[1].reduce((sum, p) => sum + p.sampleCount, 0)
        const bTotal = b[1].reduce((sum, p) => sum + p.sampleCount, 0)
        return bTotal - aTotal
      })
    : []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <FlaskConical className="h-6 w-6 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                eSMR Parameters
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Parameter{" "}
              <span className="text-gradient">Explorer</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Browse all measured water quality parameters organized by category.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parameters</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalStats.parameters)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {sortedCategories.length} categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalStats.samples)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Measurements recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sortedCategories.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Parameter groups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Parameters by Category */}
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl">Parameters by Category</CardTitle>
            <CardDescription>
              Click on a category to view all parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error ? (
              <div className="text-center py-12 text-destructive">{error}</div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading parameters...
              </div>
            ) : sortedCategories.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {sortedCategories.map(([category, params]) => {
                  const totalSamples = params.reduce((sum, p) => sum + p.sampleCount, 0)

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {params.length} parameter{params.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {formatNumber(totalSamples)} samples
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                          {params
                            .sort((a, b) => b.sampleCount - a.sampleCount)
                            .map((param) => (
                              <Link
                                key={param.id}
                                href={`/esmr/samples?parameterId=${param.id}`}
                              >
                                <Card className="hover:border-primary/50 transition-colors h-full">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">
                                      {param.parameterName}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        Samples
                                      </span>
                                      <Badge variant="secondary">
                                        {formatNumber(param.sampleCount)}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No parameters found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
