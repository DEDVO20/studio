'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';

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
  companySettingsSchema,
  invoiceSettingsSchema,
  paymentMethodsSchema,
  passwordSettingsSchema,
} from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { defaultLogoBase64 } from '@/lib/logo';

type CompanyFormValues = z.infer<typeof companySettingsSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSettingsSchema>;
type PaymentMethodsFormValues = z.infer<typeof paymentMethodsSchema>;
type PasswordFormValues = z.infer<typeof passwordSettingsSchema>;

// Default settings if nothing is in localStorage
const defaultSettings = {
  company: {
    name: 'NexusStore Inc.',
    taxId: '900.123.456-7',
    address: '123 Innovation Drive, Tech City',
    phone: '(555) 123-4567',
    email: 'contact@nexusstore.com',
    logoUrl: defaultLogoBase64,
  },
  invoice: {
    prefix: 'FAC-',
    defaultDueDateDays: 30,
  },
  paymentMethods: ['Efectivo', 'Tarjeta de Crédito/Débito', 'Transferencia Bancaria', 'Nequi', 'Daviplata'].join('\n'),
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
        const storedCompanySettings = localStorage.getItem('companySettings');
        const storedInvoiceSettings = localStorage.getItem('invoiceSettings');
        const storedPaymentMethods = localStorage.getItem('paymentMethods');

        setSettings({
            company: storedCompanySettings ? JSON.parse(storedCompanySettings) : defaultSettings.company,
            invoice: storedInvoiceSettings ? JSON.parse(storedInvoiceSettings) : defaultSettings.invoice,
            paymentMethods: storedPaymentMethods ? JSON.parse(storedPaymentMethods) : defaultSettings.paymentMethods,
        });
    } catch (error) {
        console.error("Could not parse settings from localStorage", error);
        setSettings(defaultSettings);
    }
  }, []);

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
    values: { methods: settings.paymentMethods },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Re-sync form if settings change (e.g., loaded from localStorage)
  useEffect(() => {
    companyForm.reset(settings.company);
    invoiceForm.reset(settings.invoice);
    paymentMethodsForm.reset({ methods: settings.paymentMethods });
  }, [settings, companyForm, invoiceForm, paymentMethodsForm]);


  const handleSave = (formName: string, data: any) => {
    console.log(`Guardando ${formName}:`, data);
    
    try {
        if (formName === 'Información de la Empresa') {
            localStorage.setItem('companySettings', JSON.stringify(data));
        } else if (formName === 'Facturación') {
            localStorage.setItem('invoiceSettings', JSON.stringify(data));
        } else if (formName === 'Métodos de Pago') {
            localStorage.setItem('paymentMethods', JSON.stringify(data.methods));
        }
        
        toast({
            title: 'Configuración Guardada',
            description: `La sección de ${formName} ha sido actualizada.`,
        });

        if (formName === 'Cambio de Contraseña') {
            passwordForm.reset();
        }

        // Force a window reload to reflect changes globally (e.g., logo in sidebar)
        if (formName === 'Información de la Empresa') {
           window.location.reload();
        }

    } catch (error) {
        console.error("Error saving to localStorage", error);
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudieron guardar los cambios. El almacenamiento local puede estar lleno o deshabilitado.',
        });
    }
  };

  const logoUrl = companyForm.watch('logoUrl');

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Administra la configuración principal de tu aplicación y negocio.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Información de la Empresa */}
      <Card>
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit((data) => handleSave('Información de la Empresa', data))}>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Estos datos aparecerán en las facturas y otros documentos oficiales.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={companyForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Logo</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="https://ejemplo.com/logo.png o data:image/..." />
                        </FormControl>
                        <FormDescription>Pega una URL o un Data URI (Base64). Se usará en el sidebar y PDFs.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <FormLabel>Vista Previa del Logo</FormLabel>
                    <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-md border border-dashed">
                        {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt="Vista previa del logo"
                                width={80}
                                height={80}
                                className="object-contain"
                                unoptimized
                            />
                        ) : (
                            <span className="text-xs text-muted-foreground">Sin logo</span>
                        )}
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
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle Falsa 123, Oficina 404" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
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
                      <FormLabel>Correo Electrónico</FormLabel>
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
              <Button type="submit">Guardar Cambios</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {/* Configuración de Facturación */}
      <Card>
        <Form {...invoiceForm}>
          <form onSubmit={invoiceForm.handleSubmit((data) => handleSave('Facturación', data))}>
            <CardHeader>
              <CardTitle>Configuración de Facturación</CardTitle>
              <CardDescription>Personaliza los prefijos y términos de tus facturas.</CardDescription>
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
                    <FormDescription>Usado para numerar las facturas (ej. FAC-001).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={invoiceForm.control}
                name="defaultDueDateDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de Vencimiento por Defecto</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                     <FormDescription>Plazo en días para el pago de las facturas a crédito.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Guardar Cambios</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Métodos de Pago */}
      <Card>
        <Form {...paymentMethodsForm}>
          <form onSubmit={paymentMethodsForm.handleSubmit((data) => handleSave('Métodos de Pago', data))}>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>
                Define los métodos de pago que aceptas en tu negocio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={paymentMethodsForm.control}
                name="methods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Métodos de Pago Aceptados</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormDescription>
                      Escribe un método de pago por línea. Estos aparecerán en el POS y en el registro de pagos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Guardar Métodos</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Cambio de Contraseña */}
      <Card>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit((data) => handleSave('Cambio de Contraseña', data))}>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Para mayor seguridad, te recomendamos usar una contraseña segura que no uses en otros sitios.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
               <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
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
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
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
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Actualizar Contraseña</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
