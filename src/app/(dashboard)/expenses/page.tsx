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
import { mockExpenses } from '@/lib/data';
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import type { z } from 'zod';
import type { expenseSchema } from '@/lib/schemas';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleSaveExpense = (data: z.infer<typeof expenseSchema>) => {
    if (selectedExpense) {
      // Edit logic
      setExpenses(
        expenses.map((exp) =>
          exp.id === selectedExpense.id
            ? { ...exp, ...data, updatedAt: new Date() }
            : exp
        )
      );
    } else {
      // Add logic
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        ...data,
        createdBy: 'user-1', // Placeholder
      };
      setExpenses([newExpense, ...expenses]);
    }
    closeDialog();
  };

  const openDialog = (expense: Expense | null = null) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedExpense(null);
    setIsDialogOpen(false);
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
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {format(expense.date, 'PPP')}
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
                        <DropdownMenuItem className="text-destructive">
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
      
      <ExpenseFormDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={handleSaveExpense}
        expense={selectedExpense}
      />
    </>
  );
}
