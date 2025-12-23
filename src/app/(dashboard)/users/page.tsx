'use client';

import { useState } from 'react';
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
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const roleNames = {
  admin: 'Administrador',
  seller: 'Vendedor',
  accountant: 'Contador',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra las cuentas de usuario, roles y permisos.
          </CardDescription>
        </div>
        <Button>
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
            {users.map((user) => (
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
                      <DropdownMenuItem>Editar Usuario</DropdownMenuItem>
                      <DropdownMenuItem>Ver Permisos</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Desactivar Usuario
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
  );
}
