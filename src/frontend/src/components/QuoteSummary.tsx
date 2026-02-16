import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { FileText, Plus, Printer, FileSpreadsheet, FileDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { FullQuote } from '../backend';
import { exportToExcel } from '../lib/excelParser';
import { exportToPDF } from '../lib/pdfExporter';
import { formatCurrency, formatNumber } from '../lib/formatters';

interface QuoteSummaryProps {
  quote: FullQuote;
  onNewQuote: () => void;
}

export default function QuoteSummary({ quote, onNewQuote }: QuoteSummaryProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const excelData = quote.items.map((item, index) => ({
        'S.No': index + 1,
        'Item Ref No': item.itemRefNo,
        'Category': item.category,
        'Subcategory': item.subcategory,
        'Description': item.detailedDescription || '—',
        'Quantity': Number(item.quantity),
        'Duration': Number(item.duration),
        'Standard Cost': item.standardCost,
        'Total': item.total,
      }));

      // Add grand total row
      excelData.push({
        'S.No': '',
        'Item Ref No': '',
        'Category': '',
        'Subcategory': '',
        'Description': '',
        'Quantity': '',
        'Duration': '',
        'Standard Cost': 'Grand Total:',
        'Total': quote.total,
      } as any);

      const filename = `quote_${quote.header.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(excelData, filename);
      toast.success('Quote exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error((error as Error).message || 'Failed to export to Excel. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfData = {
        header: quote.header,
        items: quote.items.map((item) => ({
          itemRefNo: item.itemRefNo,
          category: item.category,
          subcategory: item.subcategory,
          detailedDescription: item.detailedDescription,
          quantity: Number(item.quantity),
          duration: Number(item.duration),
          standardCost: item.standardCost,
          total: item.total,
        })),
        total: quote.total,
        date: new Date().toLocaleDateString(),
      };

      const filename = `quote_${quote.header.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDF(pdfData, filename, false);
      toast.success('Quote exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error((error as Error).message || 'Failed to export to PDF. Please refresh the page and try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quote Summary
              </CardTitle>
              <CardDescription>Review and export your generated quote</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Client Name</p>
              <p className="font-semibold">{quote.header.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Manager</p>
              <p className="font-semibold">{quote.header.accountManager}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Name</p>
              <p className="font-semibold">{quote.header.projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Duration</p>
              <p className="font-semibold">{quote.header.projectDuration}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Quote Items Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Ref No</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemRefNo}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.subcategory}</TableCell>
                    <TableCell className="max-w-[300px]">{item.detailedDescription}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.standardCost)}</TableCell>
                    <TableCell className="text-right">{formatNumber(Number(item.quantity))}</TableCell>
                    <TableCell className="text-right">{formatNumber(Number(item.duration))}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-semibold">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">{formatCurrency(quote.total)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between print:hidden">
          <Button variant="outline" onClick={onNewQuote}>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
