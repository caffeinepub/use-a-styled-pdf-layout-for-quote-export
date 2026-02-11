// PDF export utility using jsPDF and jspdf-autotable (loaded via CDN)

declare global {
  interface Window {
    jspdf: any;
  }
}

interface QuoteItemForPDF {
  itemRefNo: string;
  category: string;
  subcategory: string;
  detailedDescription: string;
  quantity: number;
  duration: number;
  standardCost: number;
  total: number;
}

interface AnalysisItemForPDF extends QuoteItemForPDF {
  opsBriskCost: number;
  margin: number;
  marginPercentage: number;
  totalMargin: number;
}

interface QuoteHeaderForPDF {
  clientName: string;
  projectDuration: string;
  accountManager: string;
  projectName: string;
}

interface QuoteDataForPDF {
  header: QuoteHeaderForPDF;
  items: QuoteItemForPDF[];
  total: number;
  date: string;
}

interface AnalysisDataForPDF {
  header: QuoteHeaderForPDF;
  items: AnalysisItemForPDF[];
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMarginPercentage: number;
  date: string;
}

// Helper function to format currency with Kshs prefix
function formatCurrency(value: number): string {
  return `Kshs ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to format numbers with thousand separators
function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function exportToPDF(data: QuoteDataForPDF | AnalysisDataForPDF, filename: string, isAnalysis: boolean = false): void {
  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    throw new Error('PDF export library is not loaded. Please refresh the page and try again.');
  }

  // Check if autoTable plugin is available
  if (typeof window.jspdf.jsPDF === 'undefined') {
    throw new Error('PDF table plugin is not loaded. Please refresh the page and try again.');
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Verify autoTable is available
    if (typeof doc.autoTable !== 'function') {
      throw new Error('PDF table functionality is not available. Please refresh the page and try again.');
    }

    // Set document properties
    doc.setProperties({
      title: isAnalysis ? 'Cost Analysis Report' : 'Project Quote',
      subject: isAnalysis ? 'Cost Analysis' : 'Quote',
      author: 'QuoteGen',
      keywords: 'quote, analysis, project',
      creator: 'QuoteGen Application',
    });

    if (isAnalysis) {
      generateAnalysisPDF(doc, data as AnalysisDataForPDF);
    } else {
      generateQuotePDF(doc, data as QuoteDataForPDF);
    }

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

function generateQuotePDF(doc: any, data: QuoteDataForPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text('PROJECT QUOTE', margin, 20);

  // Horizontal line under title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 25, pageWidth - margin, 25);

  // Header Information Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Project Information', margin, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Client Name:', margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.clientName, margin + 35, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Project Name:', margin, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.projectName, margin + 35, 48);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Account Manager:', pageWidth / 2, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.accountManager, pageWidth / 2 + 40, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Project Duration:', pageWidth / 2, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.projectDuration, pageWidth / 2 + 40, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated:', pageWidth / 2, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, pageWidth / 2 + 40, 54);

  // Horizontal line after header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, 58, pageWidth - margin, 58);

  // Items Section Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote Items', margin, 66);

  // Prepare table data - matching UI column structure exactly
  const tableData = data.items.map((item) => [
    item.itemRefNo,
    item.category,
    item.subcategory,
    item.detailedDescription,
    formatCurrency(item.standardCost),
    item.quantity.toString(),
    item.duration.toString(),
    formatCurrency(item.total),
  ]);

  // Generate table with autoTable - matching UI headers exactly
  doc.autoTable({
    startY: 72,
    head: [['Item Ref No', 'Category', 'Subcategory', 'Description', 'Standard Cost', 'Quantity', 'Duration', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Primary blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },   // Item Ref No
      1: { cellWidth: 24, halign: 'left' },   // Category
      2: { cellWidth: 24, halign: 'left' },   // Subcategory
      3: { cellWidth: 48, halign: 'left' },   // Description
      4: { cellWidth: 26, halign: 'right' },  // Standard Cost
      5: { cellWidth: 16, halign: 'right' },  // Quantity
      6: { cellWidth: 16, halign: 'right' },  // Duration
      7: { cellWidth: 28, halign: 'right' },  // Total
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    margin: { left: margin, right: margin },
  });

  // Grand Total Section
  const finalY = (doc as any).lastAutoTable.finalY || 72;
  
  // Add some spacing
  const totalY = finalY + 10;

  // Draw a prominent box for the grand total
  doc.setFillColor(59, 130, 246);
  doc.rect(pageWidth - margin - 75, totalY - 6, 75, 14, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Grand Total:', pageWidth - margin - 70, totalY + 2);
  doc.setFontSize(14);
  doc.text(formatCurrency(data.total), pageWidth - margin - 5, totalY + 2, { align: 'right' });

  // Footer
  addFooter(doc, pageWidth, pageHeight, margin);
}

function generateAnalysisPDF(doc: any, data: AnalysisDataForPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text('COST ANALYSIS REPORT', margin, 20);

  // Horizontal line under title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 25, pageWidth - margin, 25);

  // Header Information Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Project Information', margin, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Client Name:', margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.clientName, margin + 35, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Project Name:', margin, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.projectName, margin + 35, 48);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Account Manager:', pageWidth / 2, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.accountManager, pageWidth / 2 + 40, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Project Duration:', pageWidth / 2, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(data.header.projectDuration, pageWidth / 2 + 40, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated:', pageWidth / 2, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, pageWidth / 2 + 40, 54);

  // Horizontal line after header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, 58, pageWidth - margin, 58);

  // Summary Cards Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', margin, 66);

  const summaryY = 72;
  const cardWidth = (pageWidth - 2 * margin - 10) / 3;

  // Total Revenue Card
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, summaryY, cardWidth, 18, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.rect(margin, summaryY, cardWidth, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Revenue', margin + 2, summaryY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(formatCurrency(data.totalRevenue), margin + 2, summaryY + 13);

  // Total Profit Card
  const profitX = margin + cardWidth + 5;
  doc.setFillColor(240, 253, 244);
  doc.rect(profitX, summaryY, cardWidth, 18, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.rect(profitX, summaryY, cardWidth, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Profit', profitX + 2, summaryY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(formatCurrency(data.totalProfit), profitX + 2, summaryY + 13);

  // Margin Percentage Card
  const marginX = profitX + cardWidth + 5;
  doc.setFillColor(254, 249, 231);
  doc.rect(marginX, summaryY, cardWidth, 18, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.5);
  doc.rect(marginX, summaryY, cardWidth, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Overall Margin', marginX + 2, summaryY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 179, 8);
  doc.text(`${formatNumber(data.overallMarginPercentage)}%`, marginX + 2, summaryY + 13);

  // Items Section Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Detailed Analysis', margin, summaryY + 26);

  // Prepare table data
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.itemRefNo,
    item.detailedDescription,
    item.quantity.toString(),
    item.duration.toString(),
    formatCurrency(item.opsBriskCost),
    formatCurrency(item.standardCost),
    formatCurrency(item.margin),
    `${formatNumber(item.marginPercentage)}%`,
    formatCurrency(item.total),
    formatCurrency(item.totalMargin),
  ]);

  // Generate table with autoTable
  doc.autoTable({
    startY: summaryY + 32,
    head: [['#', 'Ref', 'Description', 'Qty', 'Dur', 'Ops Cost', 'Std Cost', 'Margin', 'Margin %', 'Revenue', 'Profit']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Primary blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, halign: 'left' },
      2: { cellWidth: 35, halign: 'left' },
      3: { cellWidth: 10, halign: 'right' },
      4: { cellWidth: 10, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 15, halign: 'right' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 22, halign: 'right' },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    margin: { left: margin, right: margin },
    didParseCell: function (data: any) {
      // Color code margin cells
      if (data.section === 'body' && (data.column.index === 7 || data.column.index === 8 || data.column.index === 10)) {
        const cellValue = data.cell.raw;
        if (typeof cellValue === 'string') {
          // Check if it's a negative value
          if (cellValue.includes('-') || (cellValue.includes('%') && parseFloat(cellValue) < 0)) {
            data.cell.styles.textColor = [220, 38, 38]; // Red for negative
          } else {
            data.cell.styles.textColor = [34, 197, 94]; // Green for positive
          }
        }
      }
    },
  });

  // Summary Section
  const finalY = (doc as any).lastAutoTable.finalY || summaryY + 32;
  const summaryBoxY = finalY + 10;

  // Draw summary box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, summaryBoxY, pageWidth - 2 * margin, 30, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, summaryBoxY, pageWidth - 2 * margin, 30);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', margin + 5, summaryBoxY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Total Revenue:', margin + 5, summaryBoxY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(data.totalRevenue), margin + 40, summaryBoxY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Cost:', margin + 5, summaryBoxY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(data.totalCost), margin + 40, summaryBoxY + 20);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Total Profit:', pageWidth / 2, summaryBoxY + 14);
  doc.setFont('helvetica', 'normal');
  const profitColor = data.totalProfit >= 0 ? [34, 197, 94] : [220, 38, 38];
  doc.setTextColor(...profitColor);
  doc.text(formatCurrency(data.totalProfit), pageWidth / 2 + 30, summaryBoxY + 14);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Margin:', pageWidth / 2, summaryBoxY + 20);
  doc.setFont('helvetica', 'normal');
  const marginColor = data.overallMarginPercentage >= 0 ? [34, 197, 94] : [220, 38, 38];
  doc.setTextColor(...marginColor);
  doc.text(`${formatNumber(data.overallMarginPercentage)}%`, pageWidth / 2 + 30, summaryBoxY + 20);

  // Footer
  addFooter(doc, pageWidth, pageHeight, margin);
}

function addFooter(doc: any, pageWidth: number, pageHeight: number, margin: number): void {
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by QuoteGen Application', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
}
