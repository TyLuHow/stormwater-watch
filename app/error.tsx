"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-12">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                An unexpected error occurred while loading this page. Our team has been notified and is working on a fix.
              </p>
            </div>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && (
              <Card className="bg-muted/50 border-destructive/20">
                <CardContent className="p-4">
                  <div className="text-left">
                    <p className="text-xs font-mono text-muted-foreground mb-2">
                      Error details (development mode):
                    </p>
                    <pre className="text-xs text-destructive overflow-auto max-h-40">
                      {error.message}
                    </pre>
                    {error.digest && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={reset}
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/dashboard"}
                variant="outline"
                size="lg"
              >
                Return to Dashboard
              </Button>
            </div>

            {/* Support Information */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <a
                  href="mailto:support@stormwaterwatch.org"
                  className="text-primary hover:underline font-medium"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}