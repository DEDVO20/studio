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
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  reference: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
};
