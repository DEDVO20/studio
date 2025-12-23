import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const mockPayments = [
    { id: 'pay-1', amount: 1000, method: 'Transfer', date: new Date(new Date().setDate(new Date().getDate() - 9)), user: 'Usuario Administrador' },
];

export function PaymentHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <CardDescription>Un registro de todos los pagos realizados para esta factura.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mockPayments.map(payment => (
                    <TableRow key={payment.id}>
                        <TableCell>{format(payment.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">{payment.method}</Badge>
                        </TableCell>
                        <TableCell>{payment.user}</TableCell>
                        <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
