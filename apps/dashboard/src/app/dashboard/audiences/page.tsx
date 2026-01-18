'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Filter, Users, Target, TrendingUp, Clock } from 'lucide-react'

export default function AudiencesPage() {
  const [segments, setSegments] = useState([
    {
      id: '1',
      name: 'High-Value Customers',
      description: 'Users with 5+ conversions in last 30 days',
      size: 12500,
      filters: 5,
      lastUpdated: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Abandoned Cart Users',
      description: 'Added to cart but no purchase in 7 days',
      size: 8340,
      filters: 3,
      lastUpdated: '2024-01-15T09:15:00Z',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mobile App Users',
      description: 'Users who interact via mobile devices',
      size: 45600,
      filters: 2,
      lastUpdated: '2024-01-14T16:45:00Z',
      status: 'active'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audiences</h1>
          <p className="text-muted-foreground mt-1">
            Build and manage custom audience segments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground">Active segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">66,440</div>
            <p className="text-xs text-muted-foreground">Across all segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">To ad platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h ago</div>
            <p className="text-xs text-muted-foreground">All platforms</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search segments..."
          className="max-w-sm"
        />
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Segments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((segment) => (
          <Card key={segment.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {segment.description}
                  </CardDescription>
                </div>
                <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {segment.status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Audience Size:</span>
                  <span className="font-medium">{segment.size.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Filters:</span>
                  <span className="font-medium">{segment.filters}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(segment.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Sync
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
