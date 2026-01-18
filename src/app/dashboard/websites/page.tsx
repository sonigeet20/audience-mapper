import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export default function WebsitesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground">
            Manage tracking codes and website configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Website
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Websites</CardTitle>
          <CardDescription>
            Configure tracking scripts and data collection settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Data Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Main Website</TableCell>
                <TableCell>example.com</TableCell>
                <TableCell className="font-mono text-xs">trk_abc123...</TableCell>
                <TableCell>Both</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
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
    </div>
  )
}
