'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, User, Users, Shield, Palette, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization and user preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="white-label">White Label</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input placeholder="Acme Inc." defaultValue="Acme Inc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input placeholder="https://example.com" defaultValue="https://example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <select className="w-full px-3 py-2 rounded-md border border-input bg-background">
                  <option>E-commerce</option>
                  <option>SaaS</option>
                  <option>Media & Publishing</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Other</option>
                </select>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Mode</CardTitle>
              <CardDescription>
                Your current deployment configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Mode:</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm">
                    Shared Infrastructure
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your data is stored in a multi-tenant environment with complete logical isolation.
                  <Button variant="link" className="h-auto p-0 ml-1">
                    Learn more about enterprise isolated deployments →
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to your organization
                  </CardDescription>
                </div>
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'John Doe', email: 'john@example.com', role: 'org_admin', status: 'active' },
                  { name: 'Jane Smith', email: 'jane@example.com', role: 'analyst', status: 'active' },
                  { name: 'Bob Johnson', email: 'bob@example.com', role: 'developer', status: 'invited' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm capitalize">{member.role.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {member.status}
                      </span>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Role-based access control matrix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>Org Admin:</strong> Full access to all features and settings</p>
                <p className="mb-2"><strong>Analyst:</strong> View analytics, create segments, manage integrations</p>
                <p className="mb-2"><strong>Developer:</strong> Manage tracking scripts, view technical documentation</p>
                <p><strong>Viewer:</strong> Read-only access to analytics and reports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API access for programmatic integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="text-sm text-muted-foreground">Created Jan 1, 2024</p>
                  </div>
                  <Button size="sm" variant="outline">Rotate</Button>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded">pk_live_••••••••••••••••</code>
              </div>
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Create New Key
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Track changes and access to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'User invited', user: 'john@example.com', timestamp: '2024-01-15 10:30:00' },
                  { action: 'Integration connected', user: 'jane@example.com', timestamp: '2024-01-14 15:20:00' },
                  { action: 'Website added', user: 'john@example.com', timestamp: '2024-01-13 09:15:00' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> by {log.user}</span>
                    </div>
                    <span className="text-muted-foreground">{log.timestamp}</span>
                  </div>
                ))}
              </div>
              <Button variant="link" className="mt-4 p-0">View Full Audit Log →</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="white-label" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Customization</CardTitle>
              <CardDescription>
                Customize the dashboard appearance (Enterprise plan)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted">
                    Logo
                  </div>
                  <Button variant="outline">Upload</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#0066FF" className="w-12 h-10 rounded border" />
                  <Input defaultValue="#0066FF" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Domain</label>
                <Input placeholder="analytics.yourdomain.com" />
                <p className="text-xs text-muted-foreground">
                  Host the dashboard on your own domain
                </p>
              </div>
              <Button>
                <Palette className="mr-2 h-4 w-4" />
                Save Branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Configure how long data is stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Data Retention</label>
                <select className="w-full px-3 py-2 rounded-md border border-input bg-background">
                  <option>30 days (then archive to S3)</option>
                  <option>60 days (then archive to S3)</option>
                  <option>90 days (then archive to S3)</option>
                  <option>1 year (then archive to S3)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Archived data moves to S3 Glacier for long-term storage
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Archive Retention</label>
                <select className="w-full px-3 py-2 rounded-md border border-input bg-background">
                  <option>1 year</option>
                  <option>2 years</option>
                  <option>5 years</option>
                  <option>Indefinite</option>
                </select>
              </div>
              <Button>
                <Database className="mr-2 h-4 w-4" />
                Update Retention Policy
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Compliance</CardTitle>
              <CardDescription>
                GDPR, CCPA, and consent management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Respect Do Not Track</p>
                  <p className="text-sm text-muted-foreground">Honor browser DNT settings</p>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">IP Anonymization</p>
                  <p className="text-sm text-muted-foreground">Mask last octet of IP addresses</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Consent Mode</p>
                  <p className="text-sm text-muted-foreground">Require user consent before tracking</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
