'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { z } from 'zod';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { useToast } from '@/hooks/use-toast';
import type { userSchema } from '@/lib/schemas';
import type { User } from '@/lib/types';

const roleNames: Record<User['role'], string> = {
  admin: 'Administrador',
  seller: 'Vendedor',
  accountant: 'Contador',
};

export default function UsersPagePostgres() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const [userToModify, setUserToModify] = useState<User | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        cache: 'no-store',
      });

      const body = (await response.json().catch(() => null)) as
        | { users?: User[]; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.message || 'No se pudieron cargar los usuarios.');
      }

      setUsers(body?.users ?? []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      toast({
        variant: 'destructive',
        title: 'Error al cargar',
        description:
          error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = async (userData: z.infer<typeof userSchema>) => {
    try {
      if (selectedUser) {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const body = (await response.json().catch(() => null)) as
          | { user?: User; message?: string }
          | null;

        if (!response.ok || !body?.user) {
          throw new Error(body?.message || 'No se pudo actualizar el usuario.');
        }

        setUsers((current) =>
          current.map((user) => (user.id === body.user!.id ? body.user! : user))
        );

        toast({
          title: 'Usuario actualizado',
          description: `Los datos de ${body.user.displayName} fueron actualizados.`,
        });
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const body = (await response.json().catch(() => null)) as
          | { user?: User; message?: string }
          | null;

        if (!response.ok || !body?.user) {
          throw new Error(body?.message || 'No se pudo crear el usuario.');
        }

        setUsers((current) => [body.user!, ...current]);

        toast({
          title: 'Usuario creado',
          description: `El usuario ${body.user.displayName} fue creado correctamente.`,
        });
      }

      closeDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description:
          error instanceof Error ? error.message : 'No se pudo guardar el usuario.',
      });
    }
  };

  const openDeactivateConfirmation = (user: User) => {
    setUserToModify(user);
    setIsDeactivateAlertOpen(true);
  };

  const handleToggleUserStatus = async () => {
    if (!userToModify) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userToModify.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !userToModify.isActive,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { user?: User; message?: string }
        | null;

      if (!response.ok || !body?.user) {
        throw new Error(body?.message || 'No se pudo actualizar el estado del usuario.');
      }

      setUsers((current) =>
        current.map((user) => (user.id === body.user!.id ? body.user! : user))
      );

      toast({
        title: `Usuario ${body.user.isActive ? 'activado' : 'desactivado'}`,
        description: `El usuario ${body.user.displayName} fue actualizado.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el estado del usuario.',
      });
    } finally {
      setIsDeactivateAlertOpen(false);
      setUserToModify(null);
    }
  };

  const openDialog = (user: User | null = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion de Usuarios</CardTitle>
          <CardDescription>Administra las cuentas de usuario, roles y permisos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => openDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Anadir Usuario
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">Rol</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Ultimo Acceso</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            <p>{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{roleNames[user.role] || user.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {format(new Date(user.lastLogin), "PPP 'a las' p", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDialog(user)}>
                              Editar Usuario
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeactivateConfirmation(user)}
                              className={
                                !user.isActive
                                  ? 'text-green-600 focus:text-green-700'
                                  : 'text-destructive focus:text-destructive'
                              }
                            >
                              {user.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion cambiara el estado de acceso para el usuario{' '}
              <span className="font-semibold">{userToModify?.displayName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleUserStatus}
              className={userToModify?.isActive ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Si, {userToModify?.isActive ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
