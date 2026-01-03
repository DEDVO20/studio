'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
  companySettingsSchema,
  invoiceSettingsSchema,
  paymentMethodsSchema,
  passwordSettingsSchema,
} from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

type CompanyFormValues = z.infer<typeof companySettingsSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSettingsSchema>;
type PaymentMethodsFormValues = z.infer<typeof paymentMethodsSchema>;
type PasswordFormValues = z.infer<typeof passwordSettingsSchema>;

// En una app real, estos valores vendrían de una DB o API
const mockSettings = {
  company: {
    name: 'NexusStore Inc.',
    taxId: '900.123.456-7',
    address: '123 Innovation Drive, Tech City',
    phone: '(555) 123-4567',
    email: 'contact@nexusstore.com',
  },
  invoice: {
    prefix: 'FAC-',
    defaultDueDateDays: 30,
  },
  paymentMethods: ['Efectivo', 'Tarjeta de Crédito/Débito', 'Transferencia Bancaria', 'Nequi', 'Daviplata'].join('\n'),
};

export default function SettingsPage() {
  const { toast } = useToast();

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: mockSettings.company,
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: mockSettings.invoice,
  });

  const paymentMethodsForm = useForm<PaymentMethodsFormValues>({
    resolver: zodResolver(paymentMethodsSchema),
    defaultValues: { methods: mockSettings.paymentMethods },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleSave = (formName: string, data: any) => {
    console.log(`Guardando ${formName}:`, data);
    // Aquí iría la lógica para guardar en la base de datos
    toast({
      title: 'Configuración Guardada',
      description: `La sección de ${formName} ha sido actualizada.`,
    });
    
    if (formName === 'Cambio de Contraseña') {
        passwordForm.reset();
    }
  };

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