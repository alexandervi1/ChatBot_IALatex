'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getUsers, deleteUser, updateUserAdmin, resetUserPassword, User } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { Trash2, Edit, Shield, Key, Lock, UserCog, RefreshCw, BarChart3, ScrollText, FileStack, Settings2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// New admin components
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ActivityLogsTable } from '@/components/admin/ActivityLogsTable';
import { DocumentsManagementTable } from '@/components/admin/DocumentsManagementTable';
import { SystemAlertsPanel } from '@/components/admin/SystemAlertsPanel';
import { SystemConfigPanel } from '@/components/admin/SystemConfigPanel';

export default function AdminPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    // Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<string>('user');
    const [newPassword, setNewPassword] = useState<string>('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
                return;
            }
            loadUsers();
        }
    }, [user, authLoading, router]);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción borrará todos sus documentos y chat.')) return;
        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            toast({ title: "Usuario eliminado" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el usuario" });
        }
    };

    const handleUpdateRole = async () => {
        if (!editingUser) return;
        try {
            const updatedUser = await updateUserAdmin(editingUser.id, { role: newRole });
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            toast({ title: "Rol actualizado" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el rol" });
        }
    };

    const handleResetPassword = async () => {
        if (!editingUser || !newPassword) return;
        setIsResettingPassword(true);
        try {
            await resetUserPassword(editingUser.id, newPassword);
            setNewPassword('');
            toast({ title: "Contraseña actualizada exitosamente" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la contraseña" });
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleRevokeApiKey = async () => {
        if (!editingUser) return;
        if (!confirm('¿Estás seguro de revocar la API Key de este usuario? Dejará de tener acceso a funciones de IA hasta que configure una nueva.')) return;
        try {
            const updatedUser = await updateUserAdmin(editingUser.id, { gemini_api_key: "" }); // Send empty string to clear
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditingUser(updatedUser); // Update local state to reflect change in UI immediately
            toast({ title: "API Key revocada" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo revocar la API Key" });
        }
    };

    const openEditModal = (u: User) => {
        setEditingUser(u);
        setNewRole(u.role);
        setNewPassword('');
    };

    if (authLoading || loading) return <div className="flex justify-center items-center h-screen">Cargando...</div>;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
                    <p className="text-muted-foreground">Panel de control y métricas del sistema.</p>
                </div>
                <Button onClick={loadUsers} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Usuarios
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4" />
                        Logs
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileStack className="h-4 w-4" />
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <AdminDashboard />
                        </div>
                        <div className="lg:col-span-1">
                            <SystemAlertsPanel />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <ActivityLogsTable />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentsManagementTable />
                </TabsContent>

                <TabsContent value="config">
                    <SystemConfigPanel />
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="h-5 w-5" />
                                Usuarios Registrados
                            </CardTitle>
                            <CardDescription>
                                Lista completa de usuarios con acceso al sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Estado API</TableHead>
                                        <TableHead>Uso de Tokens</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{u.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : ''}>
                                                    {u.role === 'admin' ? <Shield className="mr-1 h-3 w-3" /> : null}
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.has_api_key ? 'outline' : 'destructive'} className={u.has_api_key ? 'text-green-600 border-green-600 bg-green-50 dark:bg-green-950/20' : ''}>
                                                    {u.has_api_key ? 'Activa' : 'Faltante'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{u.token_usage.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[500px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Editar Usuario</DialogTitle>
                                                                <DialogDescription>
                                                                    Modifica los permisos y la seguridad de {editingUser?.email}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <Tabs defaultValue="general" className="w-full">
                                                                <TabsList className="grid w-full grid-cols-2">
                                                                    <TabsTrigger value="general">General</TabsTrigger>
                                                                    <TabsTrigger value="security">Seguridad</TabsTrigger>
                                                                </TabsList>

                                                                <TabsContent value="general" className="space-y-4 py-4">
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor="role">Rol del Sistema</Label>
                                                                        <Select value={newRole} onValueChange={setNewRole}>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Selecciona un rol" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="user">Usuario Estándar</SelectItem>
                                                                                <SelectItem value="admin">Administrador</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Los administradores tienen acceso completo a este panel.
                                                                        </p>
                                                                    </div>
                                                                    <Button onClick={handleUpdateRole} className="w-full">Guardar Cambios de Rol</Button>
                                                                </TabsContent>

                                                                <TabsContent value="security" className="space-y-6 py-4">
                                                                    <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Lock className="h-4 w-4 text-amber-500" />
                                                                            <h4 className="font-medium text-sm">Restablecer Contraseña</h4>
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                                                                            <Input
                                                                                id="new-password"
                                                                                type="password"
                                                                                value={newPassword}
                                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                                placeholder="Ingresa nueva contraseña"
                                                                            />
                                                                        </div>
                                                                        <Button
                                                                            onClick={handleResetPassword}
                                                                            disabled={!newPassword || isResettingPassword}
                                                                            variant="secondary"
                                                                            className="w-full"
                                                                        >
                                                                            {isResettingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                                                                        </Button>
                                                                    </div>

                                                                    <div className="space-y-4 border rounded-md p-4 border-destructive/20 bg-destructive/5">
                                                                        <div className="flex items-center gap-2">
                                                                            <Key className="h-4 w-4 text-destructive" />
                                                                            <h4 className="font-medium text-sm text-destructive">Zona de Peligro API</h4>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Si revocas la API Key, el usuario deberá ingresar una nueva para usar el chat.
                                                                        </p>
                                                                        <Button
                                                                            onClick={handleRevokeApiKey}
                                                                            disabled={!editingUser?.has_api_key}
                                                                            variant="destructive"
                                                                            className="w-full"
                                                                        >
                                                                            Revocar API Key
                                                                        </Button>
                                                                    </div>
                                                                </TabsContent>
                                                            </Tabs>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                        onClick={() => handleDelete(u.id)}
                                                        disabled={u.id === user?.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

