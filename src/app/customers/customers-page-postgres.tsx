'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { z } from 'zod';

import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { CustomerHistoryDialog } from '@/components/customers/customer-history-dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { customerSchema } from '@/lib/schemas';
import type { Customer, Invoice } from '@/lib/types';

export default function CustomersPagePostgres() {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [customerForHistory, setCustomerForHistory] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

  const loadCustomers = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los clientes.');
      }

      const body = (await response.json()) as { customers: Customer[] };
      setCustomers(
        body.customers.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }))
      );
    } catch (error) {
      console.error('Error loading customers from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los clientes desde Postgres.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const customersData = useMemo(() => customers ?? [], [customers]);

  const handleSaveCustomer = async (customerData: z.infer<typeof customerSchema>) => {
    try {
      const response = await fetch(
        selectedCustomer ? `/api/customers/${selectedCustomer.id}` : '/api/customers',
        {
          method: selectedCustomer ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'No se pudo guardar el cliente.');
      }

      await loadCustomers();

      toast({
        title: selectedCustomer ? 'Cliente Actualizado' : 'Cliente Creado',
        description: selectedCustomer
          ? `Los datos de ${customerData.name} han sido guardados.`
          : `El cliente ${customerData.name} ha sido añadido.`,
      });

      closeFormDialog();
    } catch (error) {
      console.error('Error saving customer in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo guardar el cliente.',
      });
      throw error;
    }
  };

  const openFormDialog = (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setSelectedCustomer(null);
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el cliente.');
      }

      await loadCustomers();

      toast({
        title: 'Cliente Eliminado',
        description: `El cliente ${customerToDelete.name} ha sido eliminado.`,
      });
    } catch (error) {
      console.error('Error deleting customer in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo eliminar el cliente.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const openHistoryDialog = async (customer: Customer) => {
    setCustomerForHistory(customer);
    setCustomerInvoices([]);
    setIsHistoryDialogOpen(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el historial del cliente.');
      }

      const body = (await response.json()) as { invoices: Invoice[] };
      setCustomerInvoices(body.invoices);
    } catch (error) {
      console.error('Error loading customer history from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo cargar el historial del cliente.',
      });
    }
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        </TableRow>
      ));
    }

    if (!customersData.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No hay clientes registrados.
          </TableCell>
        </TableRow>
      );
    }

    return customersData.map((customer) => (
      <TableRow key={customer.id}>
        <TableCell className="font-medium">{customer.name}</TableCell>
        <TableCell className="hidden sm:table-cell text-muted-foreground">{customer.email}</TableCell>
        <TableCell className="hidden sm:table-cell text-muted-foreground">{customer.phone}</TableCell>
        <TableCell className="hidden md:table-cell text-muted-foreground">
          {customer.createdAt.toLocaleDateString()}
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
              <DropdownMenuItem onClick={() => openFormDialog(customer)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void openHistoryDialog(customer)}>
                Ver Historial
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => confirmDelete(customer)}
                className="text-destructive"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gestiona tu base de datos de clientes.</CardDescription>
          </div>
          <Button onClick={() => openFormDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Correo</TableHead>
                <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                <TableHead className="hidden md:table-cell">Registrado en</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <CustomerFormDialog
        isOpen={isFormDialogOpen}
        onClose={closeFormDialog}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar a este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del
              cliente <span className="font-semibold">{customerToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {customerForHistory && (
        <CustomerHistoryDialog
          isOpen={isHistoryDialogOpen}
          onClose={() => setIsHistoryDialogOpen(false)}
          customer={customerForHistory}
          invoices={customerInvoices}
        />
      )}
    </>
  );
}
