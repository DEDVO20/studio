export { default } from './expenses-page-postgres';
/*

import { useMemo, useState } from 'react';
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
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import type { z } from 'zod';
import type { expenseSchema } from '@/lib/schemas';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

function LegacyExpensesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile: user } = useUserProfile();

  const expensesRef = useMemoFirebase(() => collection(firestore, 'expenses'), [firestore]);
  const { data: expensesData, isLoading } = useCollection<Expense>(expensesRef);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  const expenses: Expense[] = useMemo(() => {
    if (!expensesData) return [];
    return expensesData.map(e => ({
        ...e,
        date: (e.date as any)?.toDate ? (e.date as any).toDate() : new Date(),
        createdAt: (e.createdAt as any)?.toDate ? (e.createdAt as any).toDate() : new Date(),
        updatedAt: (e.updatedAt as any)?.toDate ? (e.updatedAt as any).toDate() : new Date(),
    }));
  }, [expensesData]);

  const handleSaveExpense = (data: z.infer<typeof expenseSchema>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para registrar un gasto.' });
        return;
    }
    
    if (selectedExpense) {
      // Edit logic
      const docRef = doc(firestore, 'expenses', selectedExpense.id);
      setDocumentNonBlocking(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Gasto Actualizado', description: `El gasto "${data.description}" ha sido guardado.` });

    } else {
      // Add logic
      const newExpense = {
        ...data,
        createdBy: user.id,
        createdByName: user.displayName || 'Usuario Anónimo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const collectionRef = collection(firestore, 'expenses');
      addDocumentNonBlocking(collectionRef, newExpense);
      toast({ title: 'Gasto Creado', description: `El gasto "${data.description}" ha sido añadido.` });
    }
    closeDialog();
  };

  const confirmDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!expenseToDelete) return;
    const docRef = doc(firestore, 'expenses', expenseToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Gasto Eliminado",
        description: `El gasto ha sido eliminado.`,
    });
    setIsDeleteDialogOpen(false);
    setExpenseToDelete(null);
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
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (expenses.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No hay gastos registrados.
          </TableCell>
        </TableRow>
      );
    }
    
    return expenses.map((expense) => (
      <TableRow key={expense.id}>
        <TableCell className="hidden md:table-cell text-muted-foreground">
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
              <DropdownMenuItem onClick={() => openDialog(expense)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => confirmDelete(expense)} 
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
            <TableBody>
                {renderTableBody()}
            </TableBody>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

*/
