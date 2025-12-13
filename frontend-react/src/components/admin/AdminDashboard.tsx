'use client';

import { useEffect, useState } from 'react';
import { getAnalytics, type AnalyticsData } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, MessageSquare, Key, TrendingUp } from 'lucide-react';
import { useToast } from "@/lib/hooks/use-toast";

export function AdminDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadAnalytics();
    }, []);

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

    if (loading) return <div className="flex justify-center py-8">Cargando análiticas...</div>;
    if (!analytics) return null;

    return (
        <div className="space-y-6">
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
                    <div className="space-y-2">
                        {analytics.top_users.map((user, index) => (
                            <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
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
                    </div>
                </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {analytics.role_distribution.map((role) => (
                            <div key={role.role} className="flex items-center justify-between">
                                <span className="capitalize">{role.role}</span>
                                <span className="font-bold">{role.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
