# **App Name**: NexusStore

## Core Features:

- User Authentication: Secure user login and role-based access control (admin, seller, accountant) using Firebase Authentication.
- Point of Sale (POS): Touch-friendly POS interface for product search, cart management, payment processing, and receipt printing.
- Partial Payment Handling: Enable customers to pay invoices through multiple partial payments, while the app automatically tracks balances and updates invoice status (pending, partial, paid) using Firestore transactions to ensure data consistency. It allows the accountant or seller to input and validate payment amounts and payment methods and records payment reference information.
- Intelligent Stock Alert: An AI tool analyzes sales data and historical stock levels to predict when a product will fall below its minimum stock level, providing timely alerts for restocking.  The tool factors in seasonality and current sales trends when deciding how far in advance to issue alerts.
- Reporting and Analytics: Generate sales reports, inventory reports, and expense reports with customizable filters (date, category, etc.).  Enable PDF/Excel export.
- Database Management: CRUD functionality across products, invoices, payments, customers, expenses, inventoryMovements, and settings with validation via Zod. Includes real-time updates.
- Admin Configuration: Centralized settings panel to configure company information, tax rates, invoice prefixes, payment methods, and user roles.

## Style Guidelines:

- Primary color: Dark blue (#3B82F6) for a professional and trustworthy feel.
- Background color: Light gray (#F9FAFB) to provide a clean, modern backdrop.
- Accent color: Teal (#2DD4BF) for highlights and actionable items.
- Body and headline font: 'Inter' (sans-serif) for clear, readable text throughout the application.
- Use Lucide React icons for a consistent and modern aesthetic.
- Intuitive sidebar navigation, well-structured forms, and clear data tables for efficient usability.
- Subtle transitions and loading animations to provide a smooth and responsive user experience.