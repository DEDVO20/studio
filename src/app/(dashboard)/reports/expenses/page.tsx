import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

export default function ExpensesReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Gastos</CardTitle>
        <CardDescription>
          Este reporte está en construcción.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aquí se visualizará la distribución de gastos por categoría y su evolución en el tiempo.</p>
      </CardContent>
    </Card>
  );
}
