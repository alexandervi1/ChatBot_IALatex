'use client';

import { useEffect, useState } from 'react';
import { getAnalytics, getAnalyticsTimeseries, type AnalyticsData, type TimeseriesData } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, MessageSquare, Key, TrendingUp, Activity, Clock, PieChart } from 'lucide-react';
import { useToast } from "@/lib/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Custom Colors for Charts
// ============================================================================

const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    logins: '#22C55E',      // Green
    documents: '#3B82F6',   // Blue
    chats: '#A855F7',       // Purple
    users: '#F59E0B',       // Amber
};

const PIE_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#7B1FA2', '#6D4C41', '#00ACC1'];

// ============================================================================
// Component
// ============================================================================

export function AdminDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<string>('7');
    const { toast } = useToast();

    useEffect(() => {
        loadAnalytics();
    }, []);

    useEffect(() => {
        loadTimeseries(parseInt(period));
    }, [period]);

    const loadAnalytics = async () => {
        try {
            const data = await getAnalytics();
            setAnalytics(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las métricas" });
        } finally {
            setLoading(false);
        }
    };

    const loadTimeseries = async (days: number) => {
        try {
            const data = await getAnalyticsTimeseries(days);
            setTimeseries(data);
        } catch (error) {
            console.warn('Timeseries data not available:', error);
        }
    };

    if (loading) return <div className="flex justify-center py-8">Cargando analíticas...</div>;
    if (!analytics) return null;

    // Format date for charts
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
    };

    // Format hour for hourly chart
    const formatHour = (hour: number) => `${hour}:00`;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex justify-end">
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 días</SelectItem>
                        <SelectItem value="14">Últimos 14 días</SelectItem>
                        <SelectItem value="30">Últimos 30 días</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.total_users}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.total_documents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.total_feedback}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">APIs Configuradas</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.users_with_api_key}</div>
                        <p className="text-xs text-muted-foreground">
                            {((analytics.users_with_api_key / analytics.total_users) * 100).toFixed(0)}% del total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Activity Line Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Actividad por Día
                        </CardTitle>
                        <CardDescription>Logins, documentos y chats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {timeseries?.activity_by_day && (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={timeseries.activity_by_day}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fontSize: 11 }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        labelFormatter={(label) => formatDate(label as string)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="logins"
                                        stroke={CHART_COLORS.logins}
                                        strokeWidth={2}
                                        dot={{ fill: CHART_COLORS.logins, r: 3 }}
                                        name="Logins"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="documents"
                                        stroke={CHART_COLORS.documents}
                                        strokeWidth={2}
                                        dot={{ fill: CHART_COLORS.documents, r: 3 }}
                                        name="Documentos"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="chats"
                                        stroke={CHART_COLORS.chats}
                                        strokeWidth={2}
                                        dot={{ fill: CHART_COLORS.chats, r: 3 }}
                                        name="Chats"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Documents by Type Pie Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Documentos por Tipo
                        </CardTitle>
                        <CardDescription>Distribución de formatos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {timeseries?.documents_by_type && timeseries.documents_by_type.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <RechartsPieChart>
                                    <Pie
                                        data={timeseries.documents_by_type}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="count"
                                        nameKey="type"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {timeseries.documents_by_type.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                                No hay documentos aún
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* User Growth Area Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Crecimiento de Usuarios
                        </CardTitle>
                        <CardDescription>Usuarios acumulados y nuevos registros</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {timeseries?.users_growth && (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={timeseries.users_growth}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.users} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={CHART_COLORS.users} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fontSize: 11 }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        labelFormatter={(label) => formatDate(label as string)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke={CHART_COLORS.users}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                        name="Total Usuarios"
                                    />
                                    <Bar
                                        dataKey="new_users"
                                        fill={CHART_COLORS.logins}
                                        name="Nuevos"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Hourly Activity Bar Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Actividad por Hora (24h)
                        </CardTitle>
                        <CardDescription>Distribución de actividad en las últimas 24 horas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {timeseries?.hourly_activity && (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={timeseries.hourly_activity}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="hour"
                                        tickFormatter={formatHour}
                                        tick={{ fontSize: 10 }}
                                        className="text-muted-foreground"
                                        interval={2}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        labelFormatter={(label) => `${label}:00`}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="activity"
                                        fill={CHART_COLORS.chats}
                                        name="Acciones"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Users & Role Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Top Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top 5 Usuarios Activos
                        </CardTitle>
                        <CardDescription>Usuarios con más documentos procesados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.top_users.map((user, index) => (
                                <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                                            style={{ backgroundColor: PIE_COLORS[index] }}
                                        >
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{user.document_count}</p>
                                        <p className="text-xs text-muted-foreground">documentos</p>
                                    </div>
                                </div>
                            ))}
                            {analytics.top_users.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                    No hay usuarios con documentos aún
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Role Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Roles</CardTitle>
                        <CardDescription>Usuarios por tipo de rol</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.role_distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                    data={analytics.role_distribution}
                                    layout="vertical"
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        dataKey="role"
                                        type="category"
                                        tick={{ fontSize: 11 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill={CHART_COLORS.documents}
                                        name="Usuarios"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="space-y-2">
                                {analytics.role_distribution.map((role) => (
                                    <div key={role.role} className="flex items-center justify-between">
                                        <span className="capitalize">{role.role}</span>
                                        <span className="font-bold">{role.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
