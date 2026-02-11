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

  const handleExportPDF = () => {
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
      exportToPDF(pdfData, filename, false);
      toast.success('Quote exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export to PDF. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Summary
          </CardTitle>
          <CardDescription>Review your generated quote below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Project Header Information */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h3 className="font-semibold mb-2">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Client Name:</span>
                  <p className="font-medium">{quote.header.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Project Name:</span>
                  <p className="font-medium">{quote.header.projectName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Manager:</span>
                  <p className="font-medium">{quote.header.accountManager}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Project Duration:</span>
                  <p className="font-medium">{quote.header.projectDuration}</p>
                </div>
              </div>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Items</h3>
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
                      <TableCell>{item.category || '—'}</TableCell>
                      <TableCell>{item.subcategory || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.detailedDescription || '—'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.standardCost)}</TableCell>
                      <TableCell className="text-right">{formatNumber(Number(item.quantity))}</TableCell>
                      <TableCell className="text-right">{formatNumber(Number(item.duration))}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.total)}</TableCell>
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

            <Separator />

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Grand Total</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(quote.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{quote.items.length} items</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(quote.items.reduce((sum, item) => sum + Number(item.quantity), 0))} total units
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between print:hidden">
          <Button variant="outline" onClick={onNewQuote}>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
