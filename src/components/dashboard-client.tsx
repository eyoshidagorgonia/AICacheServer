'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getCacheStats, getRecentActivity } from '@/app/actions';
import type { CacheStats, ActivityLog } from '@/lib/types';
import { BrainCircuit, Database, Gauge, History, CheckCircle, XCircle, CircleSlash } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardClientProps = {
  initialStats: CacheStats;
  initialActivity: ActivityLog[];
};

const StatCard = ({ icon: Icon, title, value, description, className }: { icon: React.ElementType, title: string, value: string | number, description: string, className?: string }) => (
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
        <div className="text-4xl font-bold font-headline tracking-wider text-primary">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export function DashboardClient({ initialStats, initialActivity }: DashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [activity, setActivity] = useState(initialActivity);

  useEffect(() => {
    const interval = setInterval(async () => {
      const [newStats, newActivity] = await Promise.all([getCacheStats(), getRecentActivity()]);
      setStats(newStats);
      setActivity(newActivity);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const hitRate = stats.requests > 0 ? (stats.hits / stats.requests) * 100 : 0;

  const chartData = [
    { name: 'Hits', value: stats.hits, fill: 'hsl(var(--chart-1))' },
    { name: 'Misses', value: stats.misses, fill: 'hsl(var(--chart-2))' },
  ];
  
  const hitRateData = [{ name: 'Hit Rate', value: hitRate }];

  const activityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'hit': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'miss': return <XCircle className="h-4 w-4 text-amber-500" />;
      case 'no-cache': return <CircleSlash className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
       <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">Dashboard</h1>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gauge} title="Cache Hit Rate" value={`${hitRate.toFixed(1)}%`} description="Ratio of cache hits to total requests" />
        <StatCard icon={History} title="Total Requests" value={stats.requests} description="All proxied requests" />
        <StatCard icon={Database} title="Cached Items" value={stats.size} description="Items in persistent cache" />
        <StatCard icon={BrainCircuit} title="Models Supported" value="2" description="Ollama & Google AI" />
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
  );
}
