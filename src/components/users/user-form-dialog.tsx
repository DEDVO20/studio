'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userSchema } from '@/lib/schemas';
import type { User } from '@/lib/types';

type UserFormValues = z.infer<typeof userSchema>;

type UserFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormValues) => void;
  user: User | null;
};

const roleNames: Record<User['role'], string> = {
    admin: 'Administrador',
    seller: 'Vendedor',
    accountant: 'Contador',
};

export function UserFormDialog({
  isOpen,
  onClose,
  onSave,
  user,
}: UserFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      displayName: '',
      email: '',
      role: 'seller',
      password: '',
      confirmPassword: ''
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          displayName: user.displayName,
          email: user.email,
          role: user.role,
        });
      } else {
        form.reset({
          displayName: '',
          email: '',
          role: 'seller',
          password: '',
          confirmPassword: ''
        });
      }
    }
  }, [isOpen, user, form]);

  const onSubmit = (values: UserFormValues) => {
    // Para la edición, eliminamos las contraseñas si no se proporcionaron
    if (isEditing) {
      delete values.password;
      delete values.confirmPassword;
    }
    
    // Validar contraseña para nuevos usuarios
    if (!isEditing && !values.password) {
        form.setError('password', { message: 'La contraseña es obligatoria para nuevos usuarios.' });
        return;
    }

    onSave(values);
    // No cerramos el dialogo ni mostramos el toast aquí, se maneja en la página principal
    // para esperar a que la operación asíncrona termine.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Actualiza los detalles del usuario.'
              : 'Añade un nuevo miembro a tu equipo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Carlos López" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="carlos.lopez@email.com" {...field} type="email" disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleNames).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                              <Input placeholder="••••••••" {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Confirmar Contraseña</FormLabel>
                          <FormControl>
                              <Input placeholder="••••••••" {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            )}
            {isEditing && <p className="text-xs text-muted-foreground">El correo y contraseña no se pueden editar desde aquí.</p>}


            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Usuario</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
