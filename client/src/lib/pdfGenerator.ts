import { CommercialClient, CommercialCampaign } from '@shared/schema';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export interface InvoiceData {
  client: CommercialClient;
  campaign: CommercialCampaign;
  vatRate: number;
  discount: number;
  additionalInfo: string;
  totals: {
    subtotal: string;
    discount: string;
    vat: string;
    total: string;
  };
  date: string;
  invoiceNumber: string;
}

/**
 * Generate a unique invoice number based on the current date and a random number
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INV-${year}${month}${day}-${random}`;
}

/**
 * Calculate the totals for the invoice
 */
export function calculateTotals(campaign: CommercialCampaign, vatRate: number, discountRate: number) {
  // Calculate a default cost per spot based on campaign data
  // In a real app, you might want to store this in the campaign table
  const defaultCostPerSpot = 100; // Default rate
  
  // Calculate cost per spot based on the campaign data we have
  // This is a temporary solution until we add the field to the database
  const estimatedCostPerSpot = defaultCostPerSpot;
  const totalSpots = campaign.totalSpots || 0;
  
  const subtotal = estimatedCostPerSpot * totalSpots;
  const discountAmount = (subtotal * discountRate) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatRate) / 100;
  const total = afterDiscount + vatAmount;
  
  return {
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    vat: vatAmount.toFixed(2),
    total: total.toFixed(2)
  };
}

/**
 * Format the data for the invoice
 */
export function formatInvoiceData(
  client: CommercialClient,
  campaign: CommercialCampaign,
  vatRate: number,
  discountRate: number,
  additionalInfo: string
): InvoiceData {
  const totals = calculateTotals(campaign, vatRate, discountRate);
  
  return {
    client,
    campaign,
    vatRate,
    discount: discountRate,
    additionalInfo,
    totals,
    date: format(new Date(), 'MMMM dd, yyyy'),
    invoiceNumber: generateInvoiceNumber()
  };
}

/**
 * Generate the HTML for the invoice
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  return `
    <div id="invoice" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #333;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h1 style="color: #2980b9; margin: 0;">INVOICE</h1>
          <p style="margin: 5px 0; font-size: 14px;">Invoice #: ${data.invoiceNumber}</p>
          <p style="margin: 5px 0; font-size: 14px;">Date: ${data.date}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #2980b9;">QCaller Studio</h2>
          <p style="margin: 5px 0; font-size: 14px;">Xcodes Innovation FZC</p>
          <p style="margin: 5px 0; font-size: 14px;">Dubai, UAE</p>
          <p style="margin: 5px 0; font-size: 14px;">info@qcaller.com</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <div>
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Bill To:</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>${data.client.name}</strong></p>
          <p style="margin: 5px 0; font-size: 14px;">${data.client.contactName || ''}</p>
          <p style="margin: 5px 0; font-size: 14px;">${data.client.address || ''}</p>
          <p style="margin: 5px 0; font-size: 14px;">${data.client.contactEmail || ''}</p>
          <p style="margin: 5px 0; font-size: 14px;">${data.client.contactPhone || ''}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Campaign Details:</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>${data.campaign.name}</strong></p>
          <p style="margin: 5px 0; font-size: 14px;">Status: ${data.campaign.status}</p>
          <p style="margin: 5px 0; font-size: 14px;">Start: ${data.campaign.startDate ? format(new Date(data.campaign.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
          <p style="margin: 5px 0; font-size: 14px;">End: ${data.campaign.endDate ? format(new Date(data.campaign.endDate), 'MMM dd, yyyy') : 'N/A'}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #2980b9; color: white;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Rate</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">
              ${data.campaign.name} - Radio Spots (${data.campaign.spotDuration || 30}s)
              ${data.campaign.timeRestrictions ? `<br><small>Time: ${data.campaign.timeRestrictions}</small>` : ''}
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${data.campaign.totalSpots || 0}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$100.00</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${data.totals.subtotal}</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${data.totals.subtotal}</span>
          </div>
          ${data.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Discount (${data.discount}%):</span>
            <span>-$${data.totals.discount}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>VAT (${data.vatRate}%):</span>
            <span>$${data.totals.vat}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #2980b9; font-weight: bold;">
            <span>Total:</span>
            <span>$${data.totals.total}</span>
          </div>
        </div>
      </div>

      ${data.additionalInfo ? `
      <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Additional Information:</h3>
        <p style="margin: 0; font-size: 14px;">${data.additionalInfo}</p>
      </div>
      ` : ''}

      <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #777;">
        <p>Thank you for your business!</p>
        <p>Please make payment within 30 days of receipt.</p>
      </div>
    </div>
  `;
}

/**
 * Export the invoice to PDF
 */
export async function exportToPdf(invoiceData: InvoiceData): Promise<string> {
  try {
    // Create a temporary div to render the invoice
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateInvoiceHTML(invoiceData);
    document.body.appendChild(tempDiv);
    
    // Use html2canvas to capture the rendered invoice
    const canvas = await html2canvas(tempDiv.firstChild as HTMLElement, {
      scale: 2, // Higher resolution
      logging: false,
      useCORS: true
    });
    
    // Remove the temporary div
    document.body.removeChild(tempDiv);
    
    // Create PDF with correct dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    
    pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
    
    // Save the PDF file
    const filename = `Invoice_${invoiceData.invoiceNumber}.pdf`;
    pdf.save(filename);
    
    return `Invoice ${invoiceData.invoiceNumber} has been generated and downloaded.`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}