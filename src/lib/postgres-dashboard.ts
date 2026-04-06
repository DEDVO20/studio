import 'server-only';

import { subDays, startOfDay } from 'date-fns';

import { listCustomers } from '@/lib/postgres-customers';
import { listInvoices } from '@/lib/postgres-invoices';
import { listInventoryProducts } from '@/lib/postgres-inventory';

export async function getDashboardSnapshot() {
  const [invoices, customers, products] = await Promise.all([
    listInvoices(),
    listCustomers(),
    listInventoryProducts(),
  ]);

  const today = new Date();
  const todayStart = startOfDay(today);
  const sevenDaysAgo = subDays(todayStart, 6);

  const todaysInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== 'cancelled' &&
      invoice.createdAt.toDateString() === today.toDateString()
  );

  const newCustomers = customers.filter(
    (customer) => customer.createdAt.toDateString() === today.toDateString()
  );

  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === 'pending' || invoice.status === 'partial'
  );

  const recentSales = invoices
    .filter((invoice) => invoice.status !== 'cancelled')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock <= product.minStock
  );

  const salesLast7Days = invoices.filter(
    (invoice) =>
      invoice.status !== 'cancelled' &&
      invoice.createdAt >= sevenDaysAgo &&
      invoice.createdAt <= today
  );

  return {
    stats: {
      todayRevenue: todaysInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
      todaySalesCount: todaysInvoices.length,
      newCustomersCount: newCustomers.length,
      pendingInvoicesCount: pendingInvoices.length,
      pendingInvoicesTotal: pendingInvoices.reduce((sum, invoice) => sum + invoice.balance, 0),
    },
    recentSales,
    lowStockProducts,
    salesLast7Days,
  };
}
