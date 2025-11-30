"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Droplets } from "lucide-react"
import type { SampleListResponse } from "@/lib/api/esmr"

interface ESMRRecentActivityProps {
  samples: SampleListResponse["samples"]
}

export function ESMRRecentActivity({ samples }: ESMRRecentActivityProps) {
  // Format date to readable format
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  // Get qualifier badge color
  const getQualifierColor = (qualifier: string): string => {
    switch (qualifier) {
      case "DETECTED":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "NOT_DETECTED":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      case "ESTIMATED":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    }
  }

  // Format qualifier text for display
  const formatQualifier = (qualifier: string): string => {
    return qualifier.replace(/_/g, " ").toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Card className="slide-in-bottom" style={{ animationDelay: "0.5s" }}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Droplets className="w-6 h-6 text-blue-500" />
              Recent eSMR Activity
            </CardTitle>
            <CardDescription className="mt-1">
              Latest water quality samples submitted to state monitoring system
            </CardDescription>
          </div>
          <Link href="/esmr/samples">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {samples.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent samples available
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/esmr/facilities/${sample.facilityPlaceId}`}
                        className="font-medium hover:underline"
                      >
                        {sample.facilityName}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sample.parameterName}
                        {sample.parameterCategory && (
                          <span className="text-xs ml-2 text-muted-foreground/70">
                            ({sample.parameterCategory})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold">
                        {sample.result ? (
                          <>
                            {sample.result} <span className="text-muted-foreground">{sample.units}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(sample.samplingDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getQualifierColor(sample.qualifier)}`}
                    >
                      {formatQualifier(sample.qualifier)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Location: {sample.locationCode}
                    </span>
                    {sample.reviewPriorityIndicator && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-orange-500/10 text-orange-600 border-orange-500/20">
                        Review Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
