"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface HealthCheck {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
}

interface SetupStatus {
  status: "pass" | "fail" | "warning"
  checks: HealthCheck[]
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
}

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/setup")
      const data = await res.json()
      setSetupStatus(data)
    } catch (error) {
      console.error("Failed to check setup status:", error)
      toast({
        title: "Error",
        description: "Failed to check setup status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "fail":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-600">Pass</Badge>
      case "fail":
        return <Badge variant="destructive">Fail</Badge>
      case "warning":
        return <Badge className="bg-amber-600">Warning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stormwater Watch Setup</h1>
          <p className="text-muted-foreground mt-2">Verify your integrations and configuration</p>
        </div>
        <Button onClick={checkStatus} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Checking setup status...</div>
          </CardContent>
        </Card>
      ) : setupStatus ? (
        <>
          {/* Summary Card */}
          <Card
            className={
              setupStatus.status === "pass"
                ? "bg-green-50 border-green-200"
                : setupStatus.status === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(setupStatus.status)}
                Setup Status: {setupStatus.status.toUpperCase()}
              </CardTitle>
              <CardDescription>
                {setupStatus.summary.passed} passed, {setupStatus.summary.warnings} warnings,{" "}
                {setupStatus.summary.failed} failed
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Health Checks */}
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">Integration Checks</h2>
            {setupStatus.checks.map((check) => (
              <Card key={check.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                        {check.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">Details</summary>
                            <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">{getStatusBadge(check.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Steps */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Ensure all required environment variables are set (see .env.example)</p>
              <p>2. Run `pnpm db:migrate` or `pnpm db:push` to set up the database schema</p>
              <p>3. Run `pnpm seed` to populate test data</p>
              <p>4. Verify all checks show "Pass" (warnings are acceptable for optional services)</p>
              <p>5. Visit the dashboard at /dashboard to start using the application</p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Failed to load setup status</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
