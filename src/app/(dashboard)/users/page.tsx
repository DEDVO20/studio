'use client';

import { useMemo, useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import type { z } from 'zod';
import type { userSchema } from '@/lib/schemas';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { createUserInSecondaryApp } from '@/firebase/admin-auth';
import { Skeleton } from '@/components/ui/skeleton';

const roleNames = {
  admin: 'Administrador',
  seller: 'Vendedor',
  accountant: 'Contador',
};

export default function UsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: usersData, isLoading } = useCollection<User>(usersRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const users: User[] = useMemo(() => {
    if (!usersData) return [];
    return usersData.map(u => ({
        ...u,
        createdAt: (u.createdAt as any)?.toDate ? (u.createdAt as any).toDate() : new Date(),
        lastLogin: (u.lastLogin as any)?.toDate ? (u.lastLogin as any).toDate() : new Date(),
    }));
  }, [usersData]);

  const handleSaveUser = async (userData: z.infer<typeof userSchema>) => {
    if (selectedUser) {
        // Edit existing user
        const userRef = doc(firestore, "users", selectedUser.id);
        updateDocumentNonBlocking(userRef, {
            displayName: userData.displayName,
            role: userData.role,
        });
        toast({
            title: "Usuario Actualizado",
            description: `Los datos de ${userData.displayName} han sido actualizados.`,
        });
    } else {
        // Create new user
        if (!userData.password) {
            toast({ variant: 'destructive', title: 'Error', description: 'La contraseña es obligatoria para nuevos usuarios.'});
            return;
        }
        try {
            const userCredential = await createUserInSecondaryApp(userData.email, userData.password);
            const newAuthUser = userCredential.user;

            const userDocRef = doc(firestore, "users", newAuthUser.uid);
            
            // Explicitly type the object to match Firestore's expectations
            const newUserForFirestore = {
                id: newAuthUser.uid,
                displayName: userData.displayName,
                email: userData.email,
                role: userData.role,
                photoURL: `https://i.pravatar.cc/150?u=${userData.email}`,
                isActive: true,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            };

            setDocumentNonBlocking(userDocRef, newUserForFirestore, { merge: false });
            toast({
                title: "Usuario Creado",
                description: `El usuario ${userData.displayName} ha sido creado.`,
            });

        } catch (error: any) {
            console.error("Error creating user:", error);
            const description = error.code === 'auth/email-already-in-use' 
                ? 'El correo electrónico ya está en uso.' 
                : 'Ocurrió un error al crear el usuario.';
            toast({
                variant: "destructive",
                title: "Error al crear usuario",
                description: description,
            });
        }
    }
    closeDialog();
  };

  const handleDeactivateUser = (user: User) => {
    const userRef = doc(firestore, "users", user.id);
    const newStatus = !user.isActive;
    updateDocumentNonBlocking(userRef, { isActive: newStatus });
    toast({
        title: `Usuario ${newStatus ? 'Activado' : 'Desactivado'}`,
        description: `El usuario ${user.displayName} ha sido ${newStatus ? 'activado' : 'desactivado'}.`,
    });
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra las cuentas de usuario, roles y permisos.
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="hidden md:table-cell">Último Acceso</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                users.map((user) => (
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
                    <TableCell>
                        <Badge variant="secondary">{roleNames[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {format(user.lastLogin, "PPP 'a las' p", { locale: es })}
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
                          <DropdownMenuItem onClick={() => openDialog(user)}>Editar Usuario</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeactivateUser(user)}
                            className={!user.isActive ? "text-green-600 focus:text-green-700" : "text-destructive focus:text-destructive"}
                          >
                            {user.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
    </>
  );
}
