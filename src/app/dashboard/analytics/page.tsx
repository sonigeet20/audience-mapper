'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Users, MousePointer, TrendingUp, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 rounded-md border border-input bg-background text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Custom range</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,456,789</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↑ 12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">54,231</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↑ 8.3%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↑ 15.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Events/User</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.3</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">↓ 2.1%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Trends</CardTitle>
                <CardDescription>Daily event volume over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chart placeholder - integrate recharts or similar
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>Most tracked events this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['page_view', 'click', 'form_submit', 'purchase', 'scroll'].map((event, i) => (
                    <div key={event} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </div>
                        <span className="font-mono text-sm">{event}</span>
                      </div>
                      <span className="text-muted-foreground">{Math.floor(Math.random() * 100000).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity Timeline</CardTitle>
              <CardDescription>Real-time event stream</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Real-time stream placeholder - WebSocket integration needed
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Breakdown</CardTitle>
              <CardDescription>Distribution by event type</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Event breakdown chart placeholder
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attribution Model Comparison</CardTitle>
              <CardDescription>Conversion credit by model</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Attribution comparison chart placeholder
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Demographics</CardTitle>
              <CardDescription>User distribution by location and device</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Demographics visualization placeholder
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
