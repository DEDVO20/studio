'use client';

import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido!',
      });
      router.push('/');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al Iniciar Sesión',
        description: 'No se pudo iniciar sesión como invitado.',
      });
    }
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Bienvenido a NexusStore
            </CardTitle>
            <CardDescription>
              Para continuar, por favor inicia sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Button onClick={handleAnonymousLogin} className="w-full" size="lg">
              Ingresar como Invitado <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
             <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>En este demo, usarás el modo anónimo para probar la aplicación.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
