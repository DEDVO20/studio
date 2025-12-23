'use server';

/**
 * @fileOverview An AI tool that analyzes sales data and historical stock levels to predict when a product will fall below its minimum stock level.
 *
 * - generateStockAlert - A function that generates a stock alert based on product data and sales history.
 * - StockAlertInput - The input type for the generateStockAlert function.
 * - StockAlertOutput - The return type for the generateStockAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StockAlertInputSchema = z.object({
  productId: z.string().describe('The ID of the product to analyze.'),
  productName: z.string().describe('The name of the product.'),
  currentStock: z.number().describe('The current stock level of the product.'),
  minStock: z.number().describe('The minimum stock level of the product.'),
  averageDailySales: z.number().describe('The average daily sales of the product over the past year.'),
  seasonalSalesVariation: z
    .number()
    .optional()
    .describe(
      'A number indicating seasonal sales variation, where 1.0 indicates no variation, above 1.0 indicates higher sales during the peak season, and below 1.0 indicates lower sales during the off-season.'
    ),
  recentSalesTrend: z
    .number()
    .optional()
    .describe(
      'A number representing the recent sales trend, where 1.0 indicates no trend, above 1.0 indicates increasing sales, and below 1.0 indicates decreasing sales.'
    ),
  leadTimeDays: z.number().describe('The number of days it takes to restock the product.'),
});

export type StockAlertInput = z.infer<typeof StockAlertInputSchema>;

const StockAlertOutputSchema = z.object({
  alertMessage: z
    .string()
    .describe(
      'A message indicating when the product is predicted to fall below the minimum stock level, and a suggestion to restock.'
    ),
  daysUntilLowStock: z
    .number()
    .describe(
      'The estimated number of days until the product falls below the minimum stock level.'
    ),
});

export type StockAlertOutput = z.infer<typeof StockAlertOutputSchema>;

export async function generateStockAlert(input: StockAlertInput): Promise<StockAlertOutput> {
  return generateStockAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stockAlertPrompt',
  input: {schema: StockAlertInputSchema},
  output: {schema: StockAlertOutputSchema},
  prompt: `You are an AI assistant that analyzes product sales data and stock levels to provide restocking alerts.

  Based on the following information, predict when the product will fall below its minimum stock level and generate a restocking alert message.

  Product: {{productName}}
  Current Stock: {{currentStock}}
  Minimum Stock: {{minStock}}
  Average Daily Sales: {{averageDailySales}}
  Seasonal Sales Variation: {{seasonalSalesVariation}}
  Recent Sales Trend: {{recentSalesTrend}}
  Restock Lead Time: {{leadTimeDays}} days

  Consider the seasonal sales variation and recent sales trend when making your prediction.  If seasonalSalesVariation is not provided, assume no seasonal variation. If recentSalesTrend is not provided, assume no recent trend.

  Output the alert message and the estimated number of days until the product falls below the minimum stock level.

  Ensure that if the current stock is already below the minimum, then the alert says so, and the daysUntilLowStock is 0.

  Adhere to the following format:

  Alert Message: [Your alert message here]
  Days Until Low Stock: [Number of days]`,
});

const generateStockAlertFlow = ai.defineFlow(
  {
    name: 'generateStockAlertFlow',
    inputSchema: StockAlertInputSchema,
    outputSchema: StockAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
