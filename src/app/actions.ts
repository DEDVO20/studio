'use server';

import {
  generateStockAlert,
  type StockAlertInput,
  type StockAlertOutput,
} from '@/ai/flows/intelligent-stock-alert';

export async function getStockAlert(
  input: StockAlertInput
): Promise<StockAlertOutput> {
  // In a real application, you might add more logic here,
  // like fetching the most up-to-date sales data before calling the AI flow.
  try {
    const alert = await generateStockAlert(input);
    return alert;
  } catch (error) {
    console.error('Error generating stock alert:', error);
    // You could return a more user-friendly error object
    throw new Error('Failed to generate AI stock alert.');
  }
}
