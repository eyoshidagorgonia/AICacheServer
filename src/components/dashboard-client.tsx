'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getCacheStats, getRecentActivity, getKeyHealthStatus } from '@/app/actions';
import type { CacheStats, ActivityLog, KeyHealth } from '@/lib/types';
import { BrainCircuit, Database, Gauge, History, CheckCircle, XCircle, CircleSlash, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { TooltipProvider, Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


type DashboardClientProps = {
  initialStats: CacheStats;
  initialActivity: ActivityLog[];
  initialKeyHealth: KeyHealth[];
};

const StatCard = ({ icon: Icon, title, value, description, className, children }: { icon: React.ElementType, title: string, value?: string | number, description: string, className?: string, children?: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className={cn("bg-card/80 backdrop-blur-sm border-border/60 shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {value && <div className="text-4xl font-bold font-headline tracking-wider text-primary">{value}</div>}
        {children}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const KeyHealthStatusIcon = ({ status }: { status: KeyHealth['status'] }) => {
  switch (status) {
    case 'healthy':
      return <ShieldCheck className="h-5 w-5 text-green-500" />;
    case 'unhealthy':
      return <ShieldAlert className="h-5 w-5 text-destructive" />;
    default:
      return <ShieldQuestion className="h-5 w-5 text-amber-500" />;
  }
};


export function DashboardClient({ initialStats, initialActivity, initialKeyHealth }: DashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [activity, setActivity] = useState(initialActivity);
  const [keyHealth, setKeyHealth] = useState(initialKeyHealth);

  useEffect(() => {
    const interval = setInterval(async () => {
      const [newStats, newActivity, newHealth] = await Promise.all([
          getCacheStats(), 
          getRecentActivity(),
          getKeyHealthStatus()
        ]);
      setStats(newStats);
      setActivity(newActivity);
      setKeyHealth(newHealth);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const hitRate = stats.requests > 0 ? (stats.hits / stats.requests) * 100 : 0;

  const chartData = [
    { name: 'Hits', value: stats.hits, fill: 'hsl(var(--chart-1))' },
    { name: 'Misses', value: stats.misses, fill: 'hsl(var(--chart-2))' },
  ];
  
  const activityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'hit': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'miss': return <XCircle className="h-4 w-4 text-amber-500" />;
      case 'no-cache': return <CircleSlash className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-8">
       <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">Dashboard</h1>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gauge} title="Cache Hit Rate" value={`${hitRate.toFixed(1)}%`} description="Ratio of cache hits to total requests" />
        <StatCard icon={History} title="Total Requests" value={stats.requests} description="All proxied requests" />
        <StatCard icon={Database} title="Cached Items" value={stats.size} description="Items in persistent cache" />
        <StatCard icon={BrainCircuit} title="AI Key Health" description="Live status of your AI provider keys">
            <ScrollArea className="h-28 my-1 -mx-4 px-4">
                <div className="flex flex-col space-y-3 py-2">
                    {keyHealth.length > 0 ? keyHealth.map((key) => (
                    <UITooltip key={key.id} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm cursor-help">
                            <div className="flex items-center gap-2">
                                <KeyHealthStatusIcon status={key.status} />
                                <div className='flex flex-col'>
                                    <span className="font-semibold text-foreground">{key.service}</span>
                                    <span className='text-xs text-muted-foreground font-code'>{key.keySnippet}</span>
                                </div>
                            </div>
                            <span className={cn(
                                "capitalize font-bold",
                                key.status === 'healthy' && 'text-green-400',
                                key.status === 'unhealthy' && 'text-destructive',
                                key.status === 'unknown' && 'text-amber-400'
                            )}>{key.status}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{key.statusSummary}</p>
                      </TooltipContent>
                    </UITooltip>
                    )) : (
                        <div className='text-center text-muted-foreground text-xs pt-4'>
                            No AI keys found. Add one on the "AI Keys" page.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </StatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-3">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg flicker">
            <CardHeader>
              <CardTitle className="font-headline">Cache Performance</CardTitle>
              <CardDescription>Hits vs. Misses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background) / 0.8)',
                            borderColor: 'hsl(var(--border))',
                            fontFamily: 'Vollkorn, serif',
                        }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="lg:col-span-2">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg h-full">
            <CardHeader>
                <CardTitle className="font-headline">Recent Activity</CardTitle>
                <CardDescription>Latest cache events</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto pr-0">
                <Table>
                    <TableBody>
                        <AnimatePresence initial={false}>
                        {activity.map((item) => (
                             <motion.tr
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="border-border/60"
                            >
                                <TableCell className="p-2">{activityIcon(item.type)}</TableCell>
                                <TableCell className="p-2 font-medium">{item.model}</TableCell>
                                <TableCell className="p-2 text-muted-foreground truncate max-w-[150px]">{item.prompt}</TableCell>
                                <TableCell className="p-2 text-right">
                                    <Badge variant={item.type === 'hit' ? 'default' : item.type === 'miss' ? 'secondary' : 'outline'} className={cn(item.type === 'hit' && 'bg-green-800/50 text-green-300 border-green-600/50', item.type === 'miss' && 'bg-amber-800/50 text-amber-300 border-amber-600/50')}>{item.type}</Badge>
                                </TableCell>
                            </motion.tr>
                        ))}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
    </TooltipProvider>
  );
}
