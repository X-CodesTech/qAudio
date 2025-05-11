import { CommercialClient, CommercialCampaign } from '@shared/schema';
import { formatInvoiceData, exportToPdf } from './pdfGenerator';
import { useToast } from '@/hooks/use-toast';

/**
 * Generate and export a PDF invoice for a campaign
 * 
 * @param client The client data
 * @param campaign The campaign data
 * @param vatRate VAT rate percentage (e.g., 5 for 5%)
 * @param discount Discount percentage (e.g., 10 for 10%)
 * @param additionalInfo Additional information to include in the invoice
 * @returns A promise that resolves when the PDF is generated and downloaded
 */
export async function generateInvoicePDF(
  client: CommercialClient, 
  campaign: CommercialCampaign,
  vatRate: number,
  discount: number,
  additionalInfo: string
): Promise<string> {
  try {
    // Format the invoice data
    const invoiceData = formatInvoiceData(
      client,
      campaign,
      vatRate,
      discount,
      additionalInfo
    );
    
    // Generate and download the PDF
    const result = await exportToPdf(invoiceData);
    return result;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}

/**
 * Generate a quick invoice with default settings
 * 
 * @param client The client data
 * @param campaign The campaign data
 * @returns A promise that resolves when the PDF is generated and downloaded
 */
export async function generateQuickInvoice(
  client: CommercialClient,
  campaign: CommercialCampaign
): Promise<string> {
  return generateInvoicePDF(client, campaign, 5, 0, '');
}