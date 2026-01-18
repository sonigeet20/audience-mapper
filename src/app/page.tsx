import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Zap, Shield, TrendingUp, Globe, Target, BarChart3, Link2, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Universal Tracking Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Track, analyze, and engage your audience across all platforms. 
              One script to rule them all.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to understand and grow your audience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Activity className="w-12 h-12 mb-4 text-blue-600" />
                <CardTitle>Real-time Tracking</CardTitle>
                <CardDescription>
                  Monitor user behavior as it happens with sub-second latency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Page views and custom events</li>
                  <li>• User properties and sessions</li>
                  <li>• UTM parameter tracking</li>
                  <li>• Device and browser detection</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-12 h-12 mb-4 text-purple-600" />
                <CardTitle>Audience Segmentation</CardTitle>
                <CardDescription>
                  Create dynamic segments based on user behavior and properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Rule-based segments</li>
                  <li>• Real-time updates</li>
                  <li>• Export to platforms</li>
                  <li>• Custom conditions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Link2 className="w-12 h-12 mb-4 text-green-600" />
                <CardTitle>Platform Integrations</CardTitle>
                <CardDescription>
                  Sync audiences to major advertising platforms automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Google Ads Customer Match</li>
                  <li>• Facebook Custom Audiences</li>
                  <li>• TikTok Ads Audiences</li>
                  <li>• LinkedIn Matched Audiences</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Share2 className="w-12 h-12 mb-4 text-orange-600" />
                <CardTitle>Affiliate Tracking</CardTitle>
                <CardDescription>
                  Track referrals, conversions, and commissions automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Click tracking with unique IDs</li>
                  <li>• Conversion attribution</li>
                  <li>• Commission calculation</li>
                  <li>• Multi-level referrals</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-12 h-12 mb-4 text-red-600" />
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Deep insights into your traffic and user behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Custom dashboards</li>
                  <li>• Event filtering</li>
                  <li>• Conversion funnels</li>
                  <li>• User timelines</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-12 h-12 mb-4 text-indigo-600" />
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Enterprise-grade security with user privacy in mind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• GDPR compliant</li>
                  <li>• Encrypted credentials</li>
                  <li>• Row-level security</li>
                  <li>• User-managed OAuth</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Tracking Script</h3>
              <p className="text-muted-foreground">
                Copy and paste one line of code into your website's head tag
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Segments</h3>
              <p className="text-muted-foreground">
                Define your audience segments based on behavior and properties
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Sync & Target</h3>
              <p className="text-muted-foreground">
                Automatically sync audiences to your advertising platforms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Performance</h2>
            <p className="text-xl text-muted-foreground">
              Enterprise-grade infrastructure that scales with you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 mb-3 text-yellow-600" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Eternal loader pattern ensures your tracking script is always cached and loads instantly
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• 1.14KB loader (1-year cache)</li>
                  <li>• CloudFront CDN delivery</li>
                  <li>• Sub-second event ingestion</li>
                  <li>• Real-time data pipeline</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="w-10 h-10 mb-3 text-blue-600" />
                <CardTitle>Global Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Multi-region infrastructure powered by AWS and Supabase
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• DynamoDB for token caching</li>
                  <li>• S3 for data archival</li>
                  <li>• Lambda for background jobs</li>
                  <li>• Edge Functions for ingestion</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="w-10 h-10 mb-3 text-purple-600" />
                <CardTitle>Multi-Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Built for teams with organization-level isolation
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Multiple websites per org</li>
                  <li>• Team member management</li>
                  <li>• Role-based access control</li>
                  <li>• Separate data per organization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 mb-3 text-green-600" />
                <CardTitle>Automated Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Set it and forget it - audiences sync automatically
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Hourly token refresh</li>
                  <li>• Daily audience sync</li>
                  <li>• Automatic error recovery</li>
                  <li>• Event-driven architecture</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join companies using our platform to track and grow their audience
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent hover:bg-white/10 text-white border-white">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/auth/signup" className="hover:text-white">Get Started</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li>Real-time Tracking</li>
                <li>Audience Segments</li>
                <li>Platform Integrations</li>
                <li>Affiliate Tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Integrations</h3>
              <ul className="space-y-2">
                <li>Google Ads</li>
                <li>Facebook Ads</li>
                <li>TikTok Ads</li>
                <li>LinkedIn Ads</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Universal Tracking Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
