'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Link as LinkIcon, CheckCircle, XCircle, Settings, AlertCircle } from 'lucide-react'
import AddIntegrationModal from './add-integration-modal'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Integration {
  id: string
  platform_name: string
  is_active: boolean
  last_sync_at: string | null
  test_connection_status: 'pending' | 'success' | 'failed' | null
  test_connection_error: string | null
  created_at: string
}

const platformInfo: Record<string, { name: string; description: string; icon: string }> = {
  'google-ads': {
    name: 'Google Ads',
    description: 'Sync audiences to Google Ads Customer Match',
    icon: '🎯'
  },
  'facebook': {
    name: 'Facebook Ads',
    description: 'Create Custom Audiences in Facebook',
    icon: '📘'
  },
  'tiktok': {
    name: 'TikTok Ads',
    description: 'Build audiences for TikTok advertising',
    icon: '🎵'
  },
  'linkedin': {
    name: 'LinkedIn Ads',
    description: 'Create Matched Audiences in LinkedIn',
    icon: '💼'
  }
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const successMessage = searchParams.get('success')
  const errorMessage = searchParams.get('error')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  async function fetchIntegrations() {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectedCount = integrations.filter(i => i.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect advertising platforms and sync your audiences
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage === 'connected' && 'Integration connected successfully!'}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage === 'invalid_callback' && 'Invalid OAuth callback'}
            {errorMessage === 'integration_not_found' && 'Integration not found'}
            {errorMessage.includes('credentials') && 'Invalid credentials provided'}
            {!['invalid_callback', 'integration_not_found'].includes(errorMessage) && 
              errorMessage.startsWith('credentials') === false && 
              `Error: ${decodeURIComponent(errorMessage)}`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Active integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Platforms</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(platformInfo).length}</div>
            <p className="text-xs text-muted-foreground">
              Supported platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.length > 0 && integrations.some(i => i.last_sync_at)
                ? 'Active'
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Sync status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading integrations...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const info = platformInfo[integration.platform_name]
            if (!info) return null

            return (
              <Card
                key={integration.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                        {info.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{info.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {info.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-2">
                        {integration.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Connected
                            </span>
                          </>
                        ) : integration.test_connection_status === 'failed' ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Failed
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                              Pending
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {integration.test_connection_error && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {integration.test_connection_error}
                      </div>
                    )}

                    {integration.is_active && integration.last_sync_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-medium">
                          {new Date(integration.last_sync_at).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      {integration.is_active ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Configure
                          </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => setModalOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Reconnect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Available Platforms (not yet connected) */}
      {integrations.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Available Platforms</CardTitle>
            <CardDescription>
              Connect your first advertising platform to start syncing audiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(platformInfo).map(([key, info]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{info.name}</h4>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to connect advertising platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Add Integration</h4>
              <p className="text-muted-foreground">
                Click "Add Integration" and select a platform. Provide your OAuth app credentials (Client ID, Client Secret, etc.)
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Complete OAuth Flow</h4>
              <p className="text-muted-foreground">
                After saving credentials, you'll be redirected to the platform's OAuth page to authorize access
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Sync Audiences</h4>
              <p className="text-muted-foreground">
                Once connected, go to Audiences page to select and sync your segments to advertising platforms
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Note: User-Managed Credentials</h4>
              <p className="text-muted-foreground">
                You must create your own OAuth apps on each platform. This ensures you have dedicated API limits and full control over your data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddIntegrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          setModalOpen(false)
          fetchIntegrations()
        }}
      />
    </div>
  )
}

