export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'seller' | 'accountant';
  photoURL: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date;
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
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
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
  dueDate: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
};

export type Expense = {
  id: string;
  date: Date;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
};
