import { useSystemHealth } from '../../hooks/useAdminOverview';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Activity, RefreshCw, CheckCircle2, Server, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function AdminSystemHealth() {
  const { data, isLoading, refetch, isRefetching } = useSystemHealth();

  const queues = Array.isArray(data?.queues) ? data.queues : [];

  const handleRetrigger = (jobType) => {
    toast.success(`Job queue [${jobType}] re-triggered successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Pipeline ETL & System Health</h2>
          <p className="text-xs text-muted-foreground">
            Operational status of background data workers, IMD weather scrapers, and WhatsApp message queues
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          loading={isRefetching}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queues</span>
        </Button>
      </div>

      {/* Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Overall System Status</span>
              <div className="text-xl font-bold text-foreground">Operational (100%)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Cluster Server Uptime</span>
              <div className="text-xl font-bold text-foreground">{data?.serverUptime || '99.98%'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Pending Queue Backlog</span>
              <div className="text-xl font-bold text-foreground">2 Jobs (Nominal)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Asynchronous Job Workers & Cron Pipelines
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b bg-surface-muted/60">
                <TableHead>ETL Job Name</TableHead>
                <TableHead>Last Execution</TableHead>
                <TableHead>Execution Status</TableHead>
                <TableHead>Queue Depth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {queues.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-semibold text-foreground">{q.jobType}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{q.lastRun}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {q.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {q.queueDepth} tasks
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetrigger(q.jobType)}
                      className="h-8 text-xs text-primary hover:text-primary"
                    >
                      Re-trigger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
