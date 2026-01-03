'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import { mockCustomers } from '@/lib/data';
import type { Customer } from '@/lib/types';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
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
import { CustomerHistoryDialog } from '@/components/customers/customer-history-dialog';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  
  // State for forms and dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // State for history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [customerForHistory, setCustomerForHistory] = useState<Customer | null>(null);

  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>) => {
    if (selectedCustomer) {
      // Editar cliente
      setCustomers(customers.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, ...customerData, updatedAt: new Date() }
          : c
      ));
    } else {
      // Crear nuevo cliente
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        ...customerData,
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCustomers([...customers, newCustomer]);
    }
    setSelectedCustomer(null);
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

  const handleDelete = () => {
    if (!customerToDelete) return;
    setCustomers(customers.filter(c => c.id !== customerToDelete.id));
    toast({
        title: "Cliente Eliminado",
        description: `El cliente ${customerToDelete.name} ha sido eliminado.`,
    });
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const openHistoryDialog = (customer: Customer) => {
    setCustomerForHistory(customer);
    setIsHistoryDialogOpen(true);
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Clientes</CardTitle>
                <CardDescription>
                    Gestiona tu base de datos de clientes.
                </CardDescription>
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
            <TableBody>
              {customers.map((customer) => (
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
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openFormDialog(customer)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openHistoryDialog(customer)}>
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
              ))}
            </TableBody>
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
                Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del cliente <span className="font-semibold">{customerToDelete?.name}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {customerForHistory && (
        <CustomerHistoryDialog 
            isOpen={isHistoryDialogOpen}
            onClose={() => setIsHistoryDialogOpen(false)}
            customer={customerForHistory}
        />
      )}
    </>
  );
}
