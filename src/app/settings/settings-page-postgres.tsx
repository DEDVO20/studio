'use client';

import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  defaultAppSettings,
  type AppSettings,
} from '@/lib/app-settings';
import { defaultLogoBase64 } from '@/lib/logo';
import {
  companySettingsSchema,
  invoiceSettingsSchema,
  passwordSettingsSchema,
  paymentMethodsSchema,
} from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

type CompanyFormValues = z.infer<typeof companySettingsSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSettingsSchema>;
type PaymentMethodsFormValues = z.infer<typeof paymentMethodsSchema>;
type PasswordFormValues = z.infer<typeof passwordSettingsSchema>;

export default function SettingsPagePostgres() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSection, setIsSavingSection] = useState<string | null>(null);

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySettingsSchema),
    values: settings.company,
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSettingsSchema),
    values: settings.invoice,
  });

  const paymentMethodsForm = useForm<PaymentMethodsFormValues>({
    resolver: zodResolver(paymentMethodsSchema),
    values: { methods: settings.paymentMethods.join('\n') },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar la configuracion.');
        }

        const body = (await response.json()) as { settings: AppSettings };

        if (isMounted) {
          setSettings(body.settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar',
          description: 'No se pudo cargar la configuracion del negocio.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    companyForm.reset(settings.company);
    invoiceForm.reset(settings.invoice);
    paymentMethodsForm.reset({ methods: settings.paymentMethods.join('\n') });
  }, [settings, companyForm, invoiceForm, paymentMethodsForm]);

  async function saveSettingsSection(
    section: 'company' | 'invoice' | 'paymentMethods',
    data: CompanyFormValues | InvoiceFormValues | PaymentMethodsFormValues,
    successTitle: string,
    successDescription: string
  ) {
    setIsSavingSection(section);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { settings?: AppSettings; message?: string }
        | null;

      if (!response.ok || !body?.settings) {
        throw new Error(body?.message || 'No se pudo guardar la configuracion.');
      }

      setSettings(body.settings);

      toast({
        title: successTitle,
        description: successDescription,
      });
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description:
          error instanceof Error ? error.message : 'No se pudieron guardar los cambios.',
      });
    } finally {
      setIsSavingSection(null);
    }
  }

  async function handlePasswordChange(data: PasswordFormValues) {
    setIsSavingSection('password');

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(body?.message || 'No se pudo actualizar la contrasena.');
      }

      passwordForm.reset();
      toast({
        title: 'Contrasena actualizada',
        description: 'La contrasena del usuario fue actualizada correctamente.',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description:
          error instanceof Error ? error.message : 'No se pudo actualizar la contrasena.',
      });
    } finally {
      setIsSavingSection(null);
    }
  }

  const logoUrl = companyForm.watch('logoUrl') || defaultLogoBase64;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuracion General</CardTitle>
          <CardDescription>
            Administra la configuracion principal del negocio desde Postgres.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <Form {...companyForm}>
          <form
            onSubmit={companyForm.handleSubmit((data) =>
              saveSettingsSection(
                'company',
                data,
                'Informacion guardada',
                'Los datos de la empresa fueron actualizados.'
              )
            )}
          >
            <CardHeader>
              <CardTitle>Informacion de la Empresa</CardTitle>
              <CardDescription>
                Estos datos apareceran en facturas y documentos del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tu Empresa S.A.S." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                <FormField
                  control={companyForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del Logo</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="https://ejemplo.com/logo.png o data:image/..."
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes usar una URL publica o un Data URI en base64.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Vista Previa</FormLabel>
                  <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-md border border-dashed">
                    <Image
                      src={logoUrl}
                      alt="Vista previa del logo"
                      width={80}
                      height={80}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
              <FormField
                control={companyForm.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT / ID Fiscal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="900.123.456-7" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direccion</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle 123, Oficina 404" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="300 123 4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electronico</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contacto@tuempresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isLoading || isSavingSection === 'company'}>
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <Form {...invoiceForm}>
          <form
            onSubmit={invoiceForm.handleSubmit((data) =>
              saveSettingsSection(
                'invoice',
                data,
                'Facturacion guardada',
                'La configuracion de facturacion fue actualizada.'
              )
            )}
          >
            <CardHeader>
              <CardTitle>Configuracion de Facturacion</CardTitle>
              <CardDescription>Personaliza prefijos y vencimientos por defecto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={invoiceForm.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefijo de Factura</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="FAC-" />
                    </FormControl>
                    <FormDescription>
                      Se usara al generar consecutivos nuevos desde el POS.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={invoiceForm.control}
                name="defaultDueDateDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Aplica al vencimiento por defecto de nuevas facturas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isLoading || isSavingSection === 'invoice'}>
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <Form {...paymentMethodsForm}>
          <form
            onSubmit={paymentMethodsForm.handleSubmit((data) =>
              saveSettingsSection(
                'paymentMethods',
                data,
                'Metodos guardados',
                'Los metodos de pago fueron actualizados.'
              )
            )}
          >
            <CardHeader>
              <CardTitle>Metodos de Pago</CardTitle>
              <CardDescription>
                Define los metodos disponibles para ventas, gastos y registro de pagos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={paymentMethodsForm.control}
                name="methods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metodos Aceptados</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormDescription>Escribe un metodo por linea.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isLoading || isSavingSection === 'paymentMethods'}>
                Guardar Metodos
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
            <CardHeader>
              <CardTitle>Cambiar Contrasena</CardTitle>
              <CardDescription>
                Actualiza la contrasena del usuario autenticado en Postgres.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrasena Actual</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contrasena</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contrasena</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSavingSection === 'password'}>
                Actualizar Contrasena
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
