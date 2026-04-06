'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { z } from 'zod';

import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
import { useUserProfile } from '@/hooks/use-user-profile';
import type { expenseSchema } from '@/lib/schemas';
import type { Expense } from '@/lib/types';

export default function ExpensesPagePostgres() {
  const { toast } = useToast();
  const { profile: user } = useUserProfile();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const loadExpenses = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los gastos.');
      }

      const body = (await response.json()) as { expenses: Expense[] };
      setExpenses(body.expenses);
    } catch (error) {
      console.error('Error loading expenses from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudieron cargar los gastos.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  const visibleExpenses = useMemo(() => expenses ?? [], [expenses]);

  const handleSaveExpense = async (data: z.infer<typeof expenseSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para registrar un gasto.',
      });
      return;
    }

    try {
      const response = await fetch(
        selectedExpense ? `/api/expenses/${selectedExpense.id}` : '/api/expenses',
        {
          method: selectedExpense ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            date: data.date.toISOString(),
            createdBy: user.id,
            createdByName: user.displayName || 'Usuario Anónimo',
          }),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'No se pudo guardar el gasto.');
      }

      await loadExpenses();

      toast({
        title: selectedExpense ? 'Gasto Actualizado' : 'Gasto Creado',
        description: selectedExpense
          ? `El gasto "${data.description}" ha sido guardado.`
          : `El gasto "${data.description}" ha sido añadido.`,
      });

      closeDialog();
    } catch (error) {
      console.error('Error saving expense in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo guardar el gasto.',
      });
    }
  };

  const confirmDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el gasto.');
      }

      await loadExpenses();

      toast({
        title: 'Gasto Eliminado',
        description: 'El gasto ha sido eliminado.',
      });
    } catch (error) {
      console.error('Error deleting expense in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo eliminar el gasto.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const openDialog = (expense: Expense | null = null) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedExpense(null);
    setIsDialogOpen(false);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-8 w-8" /></TableCell>
        </TableRow>
      ));
    }

    if (!visibleExpenses.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No hay gastos registrados.
          </TableCell>
        </TableRow>
      );
    }

    return visibleExpenses.map((expense) => (
      <TableRow key={expense.id}>
        <TableCell className="hidden text-muted-foreground md:table-cell">
          {format(expense.date, 'PPP', { locale: es })}
        </TableCell>
        <TableCell className="font-medium">{expense.description}</TableCell>
        <TableCell className="hidden sm:table-cell">
          <Badge variant="secondary">{expense.category}</Badge>
        </TableCell>
        <TableCell className="text-right font-semibold">
          ${expense.amount.toLocaleString('es-CO')}
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
              <DropdownMenuItem onClick={() => openDialog(expense)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => confirmDelete(expense)} className="text-destructive">
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
            <CardTitle>Gestión de Gastos</CardTitle>
            <CardDescription>
              Registra y supervisa los gastos operativos de tu negocio.
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Gasto
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExpenseFormDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={handleSaveExpense}
        expense={selectedExpense}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro del gasto.
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
    </>
  );
}
