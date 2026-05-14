// src/utils/pdf.util.js
// ---------------------------------------------------------------
// PDF Generation Utility using jsPDF and autoTable
// This creates professional GST invoices for the plant.
// ---------------------------------------------------------------

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './date.util'
import { formatCurrency, formatNumber } from './format.util'

/**
 * Generates a professional GST Invoice PDF
 * @param {Object} invoice - The invoice data with items and customer
 */
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  
  // --- Header Section ---
  doc.setFontSize(22)
  doc.setTextColor(249, 115, 22) // Primary Orange Color
  doc.setFont('helvetica', 'bold')
  doc.text('STONE CRUSHER ERP', 14, 20)
  
  doc.setFontSize(9)
  doc.setTextColor(120, 113, 108) // Gray text
  doc.setFont('helvetica', 'normal')
  doc.text('GSTIN: 09ABCDE1234F1Z5', 14, 26)
  doc.text('Address: Industrial Area, Phase-II, Raipur, CG', 14, 30)
  doc.text('Email: support@stonecrusher.local | Web: www.stonecrusher.local', 14, 34)
  
  // --- Invoice Info ---
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('TAX INVOICE', pageWidth - 14, 20, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoice.invoiceNo}`, pageWidth - 14, 28, { align: 'right' })
  doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - 14, 33, { align: 'right' })
  
  doc.setFillColor(249, 115, 22)
  doc.rect(pageWidth - 45, 38, 31, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.status.toUpperCase(), pageWidth - 30, 43, { align: 'center' })
  
  doc.setDrawColor(231, 229, 228)
  doc.line(14, 48, pageWidth - 14, 48)
  
  // --- Customer & Bank Section ---
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 14, 58)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.customer.name, 14, 64)
  doc.text(`Mobile: ${invoice.customer.mobile}`, 14, 69)
  if (invoice.customer.address) doc.text(`Addr: ${invoice.customer.address}`, 14, 74)
  if (invoice.customer.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`, 14, 79)

  // Bank Details (Right side)
  const bankX = pageWidth - 80
  doc.setFont('helvetica', 'bold')
  doc.text('BANK DETAILS:', bankX, 58)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Bank: State Bank of India', bankX, 64)
  doc.text('A/c: 123456789012', bankX, 69)
  doc.text('IFSC: SBIN0001234', bankX, 74)
  doc.text('Branch: Industrial Area', bankX, 79)
  
  // --- Items Table ---
  const tableColumn = ["#", "Material Description", "Qty", "Unit Price", "Amount"]
  const tableRows = invoice.items.map((item, index) => [
    index + 1,
    item.material.name,
    `${item.quantity} ${item.material.unit || 'Ton'}`,
    formatNumber(item.rate),
    formatNumber(item.amount)
  ])
  
  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [31, 41, 55], textColor: 255 }, // Dark Gray header
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  })
  
  // --- Totals Section ---
  const finalY = doc.lastAutoTable.finalY + 10
  const rightColumnX = pageWidth - 14
  
  doc.setFontSize(10)
  doc.setTextColor(120, 113, 108)
  doc.text('Subtotal:', rightColumnX - 45, finalY)
  doc.setTextColor(0, 0, 0)
  doc.text(formatCurrency(invoice.subtotal), rightColumnX, finalY, { align: 'right' })
  
  doc.setTextColor(120, 113, 108)
  doc.text(`GST (${invoice.gstPercent}%):`, rightColumnX - 45, finalY + 7)
  doc.setTextColor(0, 0, 0)
  doc.text(formatCurrency(invoice.gstAmount), rightColumnX, finalY + 7, { align: 'right' })
  
  doc.setFillColor(249, 115, 22)
  doc.rect(rightColumnX - 50, finalY + 11, 50, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', rightColumnX - 45, finalY + 17.5)
  doc.text(formatCurrency(invoice.totalAmount), rightColumnX - 5, finalY + 17.5, { align: 'right' })
  
  // Terms & Conditions
  doc.setTextColor(120, 113, 108)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMS & CONDITIONS:', 14, finalY + 10)
  doc.setFont('helvetica', 'normal')
  doc.text('1. Goods once sold will not be taken back.', 14, finalY + 15)
  doc.text('2. Interest @18% p.a. will be charged if payment not made within 7 days.', 14, finalY + 19)
  doc.text('3. Subject to Raipur Jurisdiction.', 14, finalY + 23)
  
  // Footer / Signature
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text('For STONE CRUSHER ERP', pageWidth - 14, finalY + 40, { align: 'right' })
  doc.setDrawColor(231, 229, 228)
  doc.line(pageWidth - 70, finalY + 55, pageWidth - 14, finalY + 55)
  doc.setFontSize(9)
  doc.text('Authorized Signatory', pageWidth - 14, finalY + 60, { align: 'right' })
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNo.replace(/\//g, '_')}.pdf`)
}

/**
 * Generates a professional Payment Receipt PDF
 * @param {Object} payment - The payment record with customer and invoice info
 */
export const generatePaymentReceiptPDF = (payment) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  
  // Header
  doc.setFontSize(22)
  doc.setTextColor(249, 115, 22)
  doc.setFont('helvetica', 'bold')
  doc.text('STONE CRUSHER ERP', 14, 20)
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('PAYMENT RECEIPT', pageWidth - 14, 20, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt #: PAY-${Date.now().toString().slice(-6)}`, pageWidth - 14, 28, { align: 'right' })
  doc.text(`Date: ${formatDate(new Date())}`, pageWidth - 14, 33, { align: 'right' })
  
  doc.line(14, 40, pageWidth - 14, 40)
  
  // Received From
  doc.setFont('helvetica', 'bold')
  doc.text('RECEIVED FROM:', 14, 55)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(payment.customerName || 'Customer', 14, 62)
  
  // Payment Details Table
  autoTable(doc, {
    startY: 75,
    head: [['Description', 'Amount']],
    body: [
      [`Payment received via ${payment.paymentMode.toUpperCase()}`, formatCurrency(payment.amount)],
      ['Reference / Remarks', payment.reference || '--']
    ],
    theme: 'grid',
    headStyles: { fillColor: [31, 41, 55] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  })
  
  const finalY = doc.lastAutoTable.finalY + 20
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129) // Success Green
  doc.text('TOTAL RECEIVED:', pageWidth - 100, finalY)
  doc.text(formatCurrency(payment.amount), pageWidth - 14, finalY, { align: 'right' })
  
  doc.setFontSize(9)
  doc.setTextColor(120, 113, 108)
  doc.setFont('helvetica', 'normal')
  doc.text('This is a computer generated receipt and does not require a physical signature.', 14, finalY + 30)
  
  doc.save(`Receipt_${payment.customerName}_${Date.now()}.pdf`)
}

