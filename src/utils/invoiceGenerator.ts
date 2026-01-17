import jsPDF from 'jspdf';

export interface InvoiceData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: any;
  items: Array<{
    name: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}

export const downloadInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Company Header - Centered
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ZANRU STORE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium T-Shirts & Hoodies', 105, 27, { align: 'center' });
  
  // Invoice Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 105, 40, { align: 'center' });
  
  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  // Invoice Info Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 55;
  
  doc.text(`Invoice #: ${data.orderId.slice(0, 8).toUpperCase()}`, 20, yPos);
  doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })}`, 105, yPos);
  
  // Status badge
  const statusText = data.status.toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${statusText}`, 160, yPos);
  
  yPos += 15;
  
  // Bill To and Ship To sections
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, yPos);
  doc.text('SHIP TO:', 110, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  
  // Bill To
  doc.text(data.customerName, 20, yPos);
  doc.text(data.shippingAddress.address, 110, yPos);
  yPos += 5;
  
  doc.text(data.customerEmail, 20, yPos);
  doc.text(`${data.shippingAddress.city}, ${data.shippingAddress.state}`, 110, yPos);
  yPos += 5;
  
  doc.text(data.customerPhone, 20, yPos);
  doc.text(`${data.shippingAddress.zipCode}`, 110, yPos);
  yPos += 5;
  
  doc.text(`${data.shippingAddress.country || 'Sri Lanka'}`, 110, yPos);
  yPos += 15;
  
  // Items Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Item Description', 22, yPos);
  doc.text('Size/Color', 100, yPos);
  doc.text('Qty', 130, yPos, { align: 'center' });
  doc.text('Price', 150, yPos, { align: 'right' });
  doc.text('Total', 180, yPos, { align: 'right' });
  
  yPos += 8;
  
  // Draw line after header
  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  yPos += 5;
  
  // Items
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`${index + 1}. ${item.name}`, 22, yPos);
    doc.text(`${item.size} / ${item.color}`, 100, yPos);
    doc.text(item.quantity.toString(), 130, yPos, { align: 'center' });
    doc.text(`Rs. ${item.price.toFixed(2)}`, 150, yPos, { align: 'right' });
    doc.text(`Rs. ${(item.quantity * item.price).toFixed(2)}`, 180, yPos, { align: 'right' });
    
    yPos += 7;
  });
  
  // Draw line before totals
  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;
  
  // Totals Section
  const totalsX = 140;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`Rs. ${data.subtotal.toFixed(2)}`, 180, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('Tax (GST 0%):', totalsX, yPos);
  doc.text(`Rs. ${data.tax.toFixed(2)}`, 180, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('Shipping:', totalsX, yPos);
  doc.text('Free', 180, yPos, { align: 'right' });
  yPos += 8;
  
  // Grand Total
  doc.setLineWidth(0.5);
  doc.line(140, yPos - 2, 190, yPos - 2);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', totalsX, yPos);
  doc.text(`Rs. ${data.total.toFixed(2)}`, 180, yPos, { align: 'right' });
  
  // Footer
  yPos = 270;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.text('For inquiries: support@zanrustore.com | +94 1234567890', 105, yPos, { align: 'center' });
  yPos += 5;
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated invoice and does not require a signature.', 105, yPos, { align: 'center' });
  
  // Save PDF
  doc.save(`invoice-${data.orderId.slice(0, 8)}-${Date.now()}.pdf`);
};
