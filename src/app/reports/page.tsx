'use client';

import { BarChart3, FileText, Package, Users, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const reportTypes = [
  {
    title: 'Reporte de Ventas',
    description: 'Analiza ingresos, productos más vendidos y rendimiento por período.',
    icon: BarChart3,
    href: '/reports/sales',
    color: 'text-green-600',
  },
  {
    title: 'Reporte de Inventario',
    description: 'Consulta valor del inventario, rotación de stock y productos por agotarse.',
    icon: Package,
    href: '/reports/inventory',
    color: 'text-blue-600',
  },
  {
    title: 'Reporte de Clientes',
    description: 'Identifica tus mejores clientes, saldos pendientes y historial de compras.',
    icon: Users,
    href: '/reports/customers',
    color: 'text-orange-600',
  },
  {
    title: 'Reporte de Gastos',
    description: 'Visualiza la distribución de gastos por categoría y su evolución en el tiempo.',
    icon: FileText,
    href: '/reports/expenses',
    color: 'text-red-600',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Centro de Reportes</CardTitle>
          <CardDescription>
            Obtén información valiosa sobre el rendimiento de tu negocio. Selecciona un reporte para comenzar.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className={`p-3 rounded-full bg-muted`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription className="mt-1">{report.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end justify-end">
              <Link href={report.href} passHref>
                <Button variant="outline">
                    Generar Reporte <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
