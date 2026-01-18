import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AffiliateUrlsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Affiliate URLs</h1>
          <p className="text-muted-foreground">
            Configure affiliate tracking URLs with URL patterns and obfuscation
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Affiliate URL
        </Button>
      </div>

      {/* Cookie Drop Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drops Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              94.2% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Drops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72</div>
            <p className="text-xs text-muted-foreground">
              5.8% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Blocker Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              12.6% of attempts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate URLs</CardTitle>
          <CardDescription>
            Manage affiliate tracking URLs and monitor cookie drop performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Patterns</TableHead>
                <TableHead>Daily Limit</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Obfuscation</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">
                      https://affiliate.example.com/track
                    </span>
                  </div>
                </TableCell>
                <TableCell>3 patterns</TableCell>
                <TableCell>1000</TableCell>
                <TableCell>1</TableCell>
                <TableCell>Adaptive</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">94.2%</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attribution Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Attribution Performance</CardTitle>
          <CardDescription>
            Conversions attributed to affiliate URLs (Last 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Affiliate URL #1</p>
                <p className="text-xs text-muted-foreground">
                  234 conversions • $12,450 revenue
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">3.2% conversion rate</p>
                <p className="text-xs text-muted-foreground">
                  Avg. 2.3 days to convert
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
