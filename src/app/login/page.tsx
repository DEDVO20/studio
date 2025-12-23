'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  CreditCard,
  DollarSign,
  Download,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    // In a real app, you'd handle Firebase authentication here.
    // For this demo, we'll simulate a successful login.
    console.log(values);
    toast({
      title: 'Inicio de Sesión Exitoso',
      description: '¡Bienvenido de nuevo!',
    });
    router.push('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <Card className="grid grid-cols-1 md:grid-cols-2 shadow-2xl">
          <CardHeader className="flex flex-col justify-between p-8 bg-primary text-primary-foreground rounded-t-lg md:rounded-l-lg md:rounded-r-none">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-8 w-8" />
                <h1 className="text-3xl font-bold">NexusStore</h1>
              </div>
              <p className="mt-2 text-primary-foreground/80">
                La solución de Punto de Venta completa para tu negocio.
              </p>
            </div>
            <div className="mt-8 space-y-4 text-sm text-primary-foreground/90">
                <p className="font-semibold">Optimiza tus operaciones:</p>
                <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 mt-1 shrink-0" />
                    <span>Procesamiento de ventas y pagos sin esfuerzo.</span>
                </div>
                <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-1 shrink-0" />
                    <span>Gestión integral de clientes e inventario.</span>
                </div>
                 <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 mt-1 shrink-0" />
                    <span>Facturación flexible con seguimiento de pagos parciales.</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-2xl font-semibold">
                    Bienvenido de Nuevo
                  </CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder a tu panel.
                  </CardDescription>
                </CardHeader>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@nexusstore.com"
                          {...field}
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          {...field}
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">
                  Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <a href="#" className="underline hover:text-primary">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
