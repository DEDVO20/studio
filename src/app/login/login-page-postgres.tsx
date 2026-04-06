'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function LoginPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, isLoading: isUserLoading, refreshProfile } = useUserProfile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && profile) {
      router.replace('/');
    }
  }, [profile, isUserLoading, router]);

  const handleCreateAdmin = async () => {
    setIsCreateAdminDialogOpen(false);
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'Ocurrió un error al crear la cuenta.');
      }

      await refreshProfile();

      toast({
        title: 'Cuenta de Administrador Creada',
        description: 'Bienvenido. Has creado la primera cuenta de administrador.',
      });
    } catch (error) {
      console.error('Admin creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear cuenta',
        description:
          error instanceof Error ? error.message : 'Ocurrió un error al crear la cuenta.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, introduce tu correo y contraseña.',
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
          requiresSetup?: boolean;
        } | null;

        if (response.status === 404 && body?.requiresSetup) {
          setIsCreateAdminDialogOpen(true);
          return;
        }

        throw new Error(body?.message || 'No se pudo iniciar sesión.');
      }

      await refreshProfile();

      toast({
        title: 'Inicio de Sesión Exitoso',
        description: 'Bienvenido de nuevo.',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Iniciar Sesión',
        description:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isUserLoading || profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <Logo className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-semibold">Bienvenido a BodegaStore</CardTitle>
              <CardDescription>Para continuar, por favor inicia sesión.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nexusstore.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuario no encontrado</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario con el correo <span className="font-semibold">{email}</span> no existe.
              ¿Deseas crear una nueva cuenta de administrador con estas credenciales?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateAdmin}>Sí, crear cuenta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
