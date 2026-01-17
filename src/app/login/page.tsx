'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/layout/logo';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);


  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleCreateAdmin = async () => {
    setIsCreateAdminDialogOpen(false);
    setIsLoggingIn(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newAuthUser = userCredential.user;

        const userDocRef = doc(firestore, "users", newAuthUser.uid);
        
        const newUserForFirestore = {
            id: newAuthUser.uid,
            displayName: 'Admin', // Default display name, can be changed later
            email: email,
            role: 'admin',
            photoURL: `https://i.pravatar.cc/150?u=${email}`,
            isActive: true,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        };

        await setDoc(userDocRef, newUserForFirestore);
        
        toast({
            title: "Cuenta de Administrador Creada",
            description: "¡Bienvenido! Has creado la primera cuenta de administrador.",
        });
        // The onAuthStateChanged listener in FirebaseProvider will handle the state update
        // and the useEffect will trigger the redirect.

    } catch (error: any) {
        console.error("Admin creation error:", error);
        const description = error.code === 'auth/email-already-in-use' 
            ? 'El correo electrónico ya está en uso.' 
            : 'Ocurrió un error al crear la cuenta.';
        toast({
            variant: "destructive",
            title: "Error al crear cuenta",
            description: description,
        });
    } finally {
        setIsLoggingIn(false);
    }
  }

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !userDoc.data().isActive) {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Acceso Denegado',
          description: 'Tu cuenta no está activa o no tienes permisos.',
        });
        setIsLoggingIn(false);
        return;
      }

      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de nuevo!',
      });
      // Redirect is handled by useEffect
    } catch (error: any) {
      // Newer Firebase SDK versions use 'auth/invalid-credential' for both
      // non-existent users and wrong passwords. We'll offer to create an
      // account if this error occurs, which is helpful for initial setup.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setIsCreateAdminDialogOpen(true);
      } else {
        console.error("Login error:", error);
        toast({
          variant: 'destructive',
          title: 'Error al Iniciar Sesión',
          description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true);
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
    } finally {
      setIsLoggingIn(false);
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
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                  <Logo className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-semibold">
                Bienvenido a NexusStore
              </CardTitle>
              <CardDescription>
                Para continuar, por favor inicia sesión.
              </CardDescription>
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
                    placeholder="••••••••"
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
               <div className="my-6 flex items-center">
                  <Separator className="flex-1" />
                  <span className="mx-4 text-xs text-muted-foreground">O</span>
                  <Separator className="flex-1" />
              </div>
              <Button onClick={handleAnonymousLogin} className="w-full" size="lg" variant="secondary" disabled>
                Ingresar como Invitado <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Usuario no encontrado</AlertDialogTitle>
            <AlertDialogDescription>
                El usuario con el correo <span className="font-semibold">{email}</span> no existe. ¿Deseas crear una nueva cuenta de administrador con estas credenciales?
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
