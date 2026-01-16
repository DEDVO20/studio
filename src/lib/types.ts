import { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'seller' | 'accountant';
  photoURL: string;
  isActive: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  taxRate: number; // 0 for exempt, 0.05 for 5%, 0.19 for 19%
  stock: number;
  minStock: number;
  category: string;
  supplier: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  creditLimit: number;
  currentBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type InvoiceItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  paymentMethod: string;
  notes: string;
  dueDate: Timestamp;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  reference: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
};

export type Expense = {
  id: string;
  date: Timestamp;
  description: string;
  category: string;
  amount: number;
  notes?: string;
  createdBy: string;
};
