'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Key, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

interface AddIntegrationModalProps {
  platform: 'google-ads' | 'facebook' | 'tiktok' | 'linkedin'
  onClose: () => void
  onSuccess: () => void
}

const platformConfig = {
  'google-ads': {
    name: 'Google Ads',
    icon: '🎯',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: '123456789-xxxxx.apps.googleusercontent.com' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-xxxxx' },
      { key: 'developer_token', label: 'Developer Token', type: 'password', placeholder: 'xxxxx' }
    ],
    setupGuide: 'https://developers.google.com/google-ads/api/docs/get-started/oauth',
    description: 'Sync audiences to Google Ads Customer Match lists'
  },
  'facebook': {
    name: 'Facebook Ads',
    icon: '📘',
    fields: [
      { key: 'app_id', label: 'App ID', type: 'text', placeholder: '123456789' },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'xxxxx' }
    ],
    setupGuide: 'https://developers.facebook.com/docs/marketing-api/get-started',
    description: 'Create Custom Audiences in Facebook Business Manager'
  },
  'tiktok': {
    name: 'TikTok Ads',
    icon: '🎵',
    fields: [
      { key: 'client_key', label: 'Client Key', type: 'text', placeholder: 'xxxxx' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx' }
    ],
    setupGuide: 'https://business-api.tiktok.com/portal/docs?id=1738855176671234',
    description: 'Build audiences for TikTok advertising campaigns'
  },
  'linkedin': {
    name: 'LinkedIn Ads',
    icon: '💼',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx' }
    ],
    setupGuide: 'https://learn.microsoft.com/en-us/linkedin/marketing/getting-started',
    description: 'Create Matched Audiences for LinkedIn campaigns'
  }
}

export default function AddIntegrationModal({ platform, onClose, onSuccess }: AddIntegrationModalProps) {
  const config = platformConfig[platform]
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
    setTestResult(null)
    setError(null)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          credentials
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult('success')
      } else {
        setTestResult('error')
        setError(data.error || 'Connection test failed')
      }
    } catch (err) {
      setTestResult('error')
      setError('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_name: platform,
          credentials,
          credential_type: 'oauth2'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Initiate OAuth flow
        window.location.href = data.oauth_url
      } else {
        setError(data.error || 'Failed to save integration')
      }
    } catch (err) {
      setError('Failed to save integration')
    } finally {
      setLoading(false)
    }
  }

  const allFieldsFilled = config.fields.every(field => credentials[field.key]?.trim())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                {config.icon}
              </div>
              <div>
                <CardTitle>Connect {config.name}</CardTitle>
                <CardDescription className="mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Setup Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              <Key className="h-4 w-4" />
              How to get your credentials
            </div>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-decimal">
              <li>Go to the {config.name} developer console</li>
              <li>Create a new OAuth application</li>
              <li>Set the redirect URI to: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">https://yourdomain.com/api/integrations/{platform}/callback</code></li>
              <li>Copy your credentials and paste them below</li>
            </ol>
            <a
              href={config.setupGuide}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View detailed setup guide <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Credential Fields */}
          <div className="space-y-4">
            <h4 className="font-medium">Enter Your Credentials</h4>
            {config.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Test Connection */}
          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                testResult === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
              }`}
            >
              {testResult === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection successful!</p>
                    <p className="text-sm mt-1">Your credentials are valid. Click "Continue" to authorize access.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection failed</p>
                    <p className="text-sm mt-1">{error || 'Please check your credentials and try again.'}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && !testResult && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3 text-red-900 dark:text-red-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!allFieldsFilled || testing}
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!allFieldsFilled || loading || testResult !== 'success'}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Continue to Authorization'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your credentials are encrypted and stored securely. We never share your data with third parties.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
