"use client"

import type { Subscription } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Edit, Mail, Bell, Power, PowerOff } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SubscriptionsListProps {
  subscriptions: Array<
    Subscription & {
      user?: {
        email: string
        name: string | null
      }
    }
  >
}

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Deleted",
          description: "Subscription removed successfully",
        })
        window.location.reload()
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete subscription",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
      setDeleteId(null)
    }
  }

  const handleToggle = async (subscription: Subscription) => {
    setLoading(subscription.id)
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !subscription.active }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Updated",
          description: `Subscription ${subscription.active ? "disabled" : "enabled"}`,
        })
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update subscription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Toggle subscription error:", error)
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleTestSend = async (subscriptionId: string) => {
    setLoading(subscriptionId)
    try {
      const res = await fetch("/api/subscriptions/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Test Alert Sent",
          description: `Sent ${data.sent || 0} alert(s)`,
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send test alert",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No subscriptions yet. Create one to start receiving alerts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>Manage your alert rules and monitoring areas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Filters</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const params = sub.params as any
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.mode}</Badge>
                    </TableCell>
                    <TableCell>{sub.schedule}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(sub.delivery === "EMAIL" || sub.delivery === "BOTH") && (
                          <Mail className="w-4 h-4" />
                        )}
                        {(sub.delivery === "SLACK" || sub.delivery === "BOTH") && (
                          <Bell className="w-4 h-4" />
                        )}
                        <span className="text-sm">{sub.delivery}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div>Ratio: ≥{Number(sub.minRatio).toFixed(1)}×</div>
                        <div>Threshold: {sub.repeatOffenderThreshold}</div>
                        {sub.impairedOnly && <div className="text-amber-600">Impaired only</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.lastRunAt ? new Date(sub.lastRunAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.active ? "default" : "secondary"}>
                        {sub.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestSend(sub.id)}
                          disabled={loading === sub.id}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(sub)}
                          disabled={loading === sub.id}
                        >
                          {sub.active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(sub.id)}
                          disabled={loading === sub.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription and stop all future alerts. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
