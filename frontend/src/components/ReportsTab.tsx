import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { FileSpreadsheet, Loader2, FileText, Download } from 'lucide-react';
import { useGetQuoteHistory } from '../hooks/useQueries';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { exportToExcel } from '../lib/excelParser';
import { toast } from 'sonner';
import type { QuoteHistoryItem } from '../backend';

export default function ReportsTab() {
  const { data: history, isLoading } = useGetQuoteHistory();
  const [selectedQuote, setSelectedQuote] = useState<QuoteHistoryItem | null>(null);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectQuote = (quote: QuoteHistoryItem) => {
    setSelectedQuote(quote);
  };

  const handleExportToExcel = () => {
    if (!selectedQuote) return;

    try {
      const excelData = [
        // Header information
        { 'Field': 'Client Name', 'Value': selectedQuote.header.clientName },
        { 'Field': 'Project Name', 'Value': selectedQuote.header.projectName },
        { 'Field': 'Account Manager', 'Value': selectedQuote.header.accountManager },
        { 'Field': 'Project Duration', 'Value': selectedQuote.header.projectDuration },
        { 'Field': 'Generated Date', 'Value': formatTimestamp(selectedQuote.timestamp) },
        {},
        // Line items
        { 'S.No': 'S.No', 'Item Ref No': 'Item Ref No', 'Category': 'Category', 'Subcategory': 'Subcategory', 'Description': 'Description', 'Quantity': 'Quantity', 'Duration': 'Duration', 'Unit Cost': 'Unit Cost', 'Total': 'Total' },
        ...selectedQuote.items.map((item, index) => ({
          'S.No': index + 1,
          'Item Ref No': item.itemRefNo,
          'Category': item.category,
          'Subcategory': item.subcategory,
          'Description': item.detailedDescription || '—',
          'Quantity': Number(item.quantity),
          'Duration': Number(item.duration),
          'Unit Cost': item.standardCost,
          'Total': item.total,
        })),
        {},
        // Grand total
        {
          'S.No': '',
          'Item Ref No': '',
          'Category': '',
          'Subcategory': '',
          'Description': '',
          'Quantity': '',
          'Duration': '',
          'Unit Cost': 'Grand Total:',
          'Total': selectedQuote.total,
        },
      ];

      const filename = `report_${selectedQuote.header.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(excelData, filename);
      toast.success('Report exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error((error as Error).message || 'Failed to export to Excel. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
          <p className="text-muted-foreground">
            Generate your first quote to see reports here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedHistory = [...history].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-6">
      {/* Quote Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Reports
          </CardTitle>
          <CardDescription>
            Select a quote to view detailed report and export to Excel ({history.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={selectedQuote?.id === item.id ? 'bg-muted' : ''}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </TableCell>
                    <TableCell>{item.header.clientName}</TableCell>
                    <TableCell>{item.header.projectName}</TableCell>
                    <TableCell>{item.header.accountManager}</TableCell>
                    <TableCell className="text-right">{item.items.length}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={selectedQuote?.id === item.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSelectQuote(item)}
                      >
                        {selectedQuote?.id === item.id ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Selected Quote Details */}
      {selectedQuote && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quote Details</CardTitle>
                <CardDescription>
                  {selectedQuote.header.projectName} - {selectedQuote.header.clientName}
                </CardDescription>
              </div>
              <Button onClick={handleExportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Information */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h3 className="font-semibold mb-2">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Client Name:</span>
                  <p className="font-medium">{selectedQuote.header.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Project Name:</span>
                  <p className="font-medium">{selectedQuote.header.projectName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Manager:</span>
                  <p className="font-medium">{selectedQuote.header.accountManager}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Project Duration:</span>
                  <p className="font-medium">{selectedQuote.header.projectDuration}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Generated:</span>
                  <p className="font-medium">{formatTimestamp(selectedQuote.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="font-semibold mb-4">Line Items</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Item Ref No</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuote.items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.itemRefNo}</TableCell>
                        <TableCell>{item.category || '—'}</TableCell>
                        <TableCell>{item.subcategory || '—'}</TableCell>
                        <TableCell className="max-w-[250px]">{item.detailedDescription || '—'}</TableCell>
                        <TableCell className="text-right">{formatNumber(Number(item.quantity))}</TableCell>
                        <TableCell className="text-right">{formatNumber(Number(item.duration))}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.standardCost)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8} className="text-right font-semibold">
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {formatCurrency(selectedQuote.total)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Grand Total</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(selectedQuote.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{selectedQuote.items.length} items</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(selectedQuote.items.reduce((sum, item) => sum + Number(item.quantity), 0))} total units
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
