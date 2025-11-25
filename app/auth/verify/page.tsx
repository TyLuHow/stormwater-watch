import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Disable prerendering since auth is not configured yet
export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>We sent you a login link. Click it to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The link expires in 24 hours.</p>
        </CardContent>
      </Card>
    </div>
  )
}
