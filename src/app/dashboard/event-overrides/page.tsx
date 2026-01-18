'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, AlertCircle, CheckCircle } from 'lucide-react'

export default function EventOverridesPage() {
  const [overrides, setOverrides] = useState([
    {
      id: '1',
      originalEvent: 'click_button_hero',
      originalClassification: 'low',
      newClassification: 'high',
      reason: 'Primary CTA on homepage',
      confidence: 0.45,
      eventsAffected: 12500,
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      originalEvent: 'scroll_depth_25',
      originalClassification: 'medium',
      newClassification: 'low',
      reason: 'Not a strong engagement signal',
      confidence: 0.62,
      eventsAffected: 45000,
      status: 'active',
      createdAt: '2024-01-14T14:30:00Z',
    }
  ])

  const [autoDetected, setAutoDetected] = useState([
    {
      id: '1',
      eventName: 'click_banner_promo',
      classification: 'medium',
      confidence: 0.58,
      occurrences: 8900,
      websites: ['example.com', 'shop.example.com'],
      needsReview: true,
    },
    {
      id: '2',
      eventName: 'form_start_checkout',
      classification: 'high',
      confidence: 0.89,
      occurrences: 5600,
      websites: ['example.com'],
      needsReview: false,
    },
    {
      id: '3',
      eventName: 'video_play_product_demo',
      classification: 'medium',
      confidence: 0.61,
      occurrences: 3200,
      websites: ['example.com', 'learn.example.com'],
      needsReview: true,
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Overrides</h1>
          <p className="text-muted-foreground mt-1">
            Review auto-detected events and manually adjust classifications
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Override
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Detected</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoDetected.length}</div>
            <p className="text-xs text-muted-foreground">Events this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autoDetected.filter(e => e.needsReview).length}
            </div>
            <p className="text-xs text-muted-foreground">Low confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Overrides</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overrides.length}</div>
            <p className="text-xs text-muted-foreground">Manual classifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Reclassified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">57.5K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Detected Events */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Detected Events (Needs Review)</CardTitle>
          <CardDescription>
            Review these events detected by ML classification and adjust if needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {autoDetected.filter(e => e.needsReview).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {event.eventName}
                    </code>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.classification === 'high' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : event.classification === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {event.classification}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {(event.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{event.occurrences.toLocaleString()} occurrences</span>
                    <span>•</span>
                    <span>{event.websites.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 text-sm rounded-md border border-input bg-background">
                    <option>Keep as {event.classification}</option>
                    <option>Reclassify as high</option>
                    <option>Reclassify as medium</option>
                    <option>Reclassify as low</option>
                  </select>
                  <Button size="sm">Apply</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Overrides */}
      <Card>
        <CardHeader>
          <CardTitle>Active Overrides</CardTitle>
          <CardDescription>
            Manual event classification overrides currently in effect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {override.originalEvent}
                    </code>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 line-through">
                        {override.originalClassification}
                      </span>
                      <span>→</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        override.newClassification === 'high' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {override.newClassification}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{override.reason}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{override.eventsAffected.toLocaleString()} events affected</span>
                    <span>•</span>
                    <span>Created {new Date(override.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
