import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

export default function InventoryReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Inventario</CardTitle>
        <CardDescription>
          Este reporte está en construcción.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aquí se mostrarán detalles sobre el valor del inventario, la rotación de stock y los productos por agotarse.</p>
      </CardContent>
    </Card>
  );
}
