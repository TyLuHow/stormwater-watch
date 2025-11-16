import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSubscriptionForm } from "@/components/subscriptions/create-form"
import { SubscriptionsList } from "@/components/subscriptions/list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SubscriptionsPage() {
  const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

  // In dev mode, show all subscriptions; otherwise require auth
  let subscriptions: any[] = []
  if (isDev) {
    // Dev mode: show all subscriptions
    subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })
  } else {
    // Production: require auth (uncomment when auth is enabled)
    // const session = await auth()
    // if (!session?.user) {
    //   redirect("/auth/signin")
    // }
    // subscriptions = await prisma.subscription.findMany({
    //   where: { userId: session.user.id! },
    //   orderBy: { createdAt: "desc" },
    //   include: {
    //     user: {
    //       select: {
    //         email: true,
    //         name: true,
    //       },
    //     },
    //   },
    // })
    subscriptions = [] // Empty in production until auth is enabled
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-2">Manage your alert rules and monitoring areas</p>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Subscription</TabsTrigger>
          <TabsTrigger value="list">Your Subscriptions ({subscriptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Subscription</CardTitle>
              <CardDescription>
                Set up alerts for violations matching your spatial and filter criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateSubscriptionForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <SubscriptionsList subscriptions={subscriptions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
