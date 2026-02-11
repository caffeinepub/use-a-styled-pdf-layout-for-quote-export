import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { BarChart3, TrendingUp, DollarSign, FileSpreadsheet, FileDown, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { FullQuote } from '../backend';
import { exportToExcel } from '../lib/excelParser';
import { exportToPDF } from '../lib/pdfExporter';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';
import { useUpdateStandardCost } from '../hooks/useQueries';

interface AnalysisTabProps {
  quote: FullQuote;
  onQuoteUpdated?: (updatedQuote: FullQuote) => void;
}

interface EditableItem {
  id: string;
  itemRefNo: string;
  category: string;
  subcategory: string;
  detailedDescription: string;
  opsBriskCost: number;
  standardCost: number;
  quantity: number;
  duration: number;
}

export default function AnalysisTab({ quote, onQuoteUpdated }: AnalysisTabProps) {
  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    quote.items.map((item) => ({
      id: item.id,
      itemRefNo: item.itemRefNo,
      category: item.category,
      subcategory: item.subcategory,
      detailedDescription: item.detailedDescription,
      opsBriskCost: item.opsBriskCost,
      standardCost: item.standardCost,
      quantity: Number(item.quantity),
      duration: Number(item.duration),
    }))
  );

  const { mutate: updateStandardCost, isPending: isUpdating } = useUpdateStandardCost();

  const handleStandardCostChange = (index: number, newCost: number) => {
    const newItems = [...editableItems];
    newItems[index].standardCost = Math.max(0, newCost);
    setEditableItems(newItems);
  };

  const analysisData = useMemo(() => {
    const items = editableItems.map((item) => {
      const total = item.standardCost * item.quantity * item.duration;
      const margin = item.standardCost - item.opsBriskCost;
      const marginPercentage = item.standardCost > 0 ? (margin / item.standardCost) * 100 : 0;
      const totalMargin = margin * item.quantity * item.duration;
      const totalCost = item.opsBriskCost * item.quantity * item.duration;

      return {
        ...item,
        total,
        margin,
        marginPercentage,
        totalMargin,
        totalCost,
      };
    });

    const totalRevenue = items.reduce((sum, item) => sum + item.total, 0);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalMargin = items.reduce((sum, item) => sum + item.totalMargin, 0);
    const overallMarginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      items,
      totalRevenue,
      totalCost,
      totalProfit,
      totalMargin,
      overallMarginPercentage,
    };
  }, [editableItems]);

  const handleUpdateCosts = () => {
    // Update all changed costs in the backend
    const updates = editableItems.map((item, index) => {
      const originalItem = quote.items[index];
      if (item.standardCost !== originalItem.standardCost) {
        return { itemId: item.id, newStandardCost: item.standardCost };
      }
      return null;
    }).filter(Boolean) as { itemId: string; newStandardCost: number }[];

    if (updates.length === 0) {
      toast.info('No changes to update');
      return;
    }

    // Update each item
    let completed = 0;
    updates.forEach(({ itemId, newStandardCost }) => {
      updateStandardCost(
        { itemId, newStandardCost },
        {
          onSuccess: () => {
            completed++;
            if (completed === updates.length) {
              // Update the quote with new values
              const updatedQuote: FullQuote = {
                ...quote,
                items: editableItems.map((item) => ({
                  ...quote.items.find((qi) => qi.id === item.id)!,
                  standardCost: item.standardCost,
                  total: item.standardCost * item.quantity * item.duration,
                })),
                total: analysisData.totalRevenue,
              };
              
              if (onQuoteUpdated) {
                onQuoteUpdated(updatedQuote);
              }
              
              toast.success(`Updated ${updates.length} standard cost${updates.length > 1 ? 's' : ''} successfully!`);
            }
          },
          onError: (error) => {
            toast.error(`Failed to update cost: ${error.message}`);
          },
        }
      );
    });
  };

  const handleResetCosts = () => {
    setEditableItems(
      quote.items.map((item) => ({
        id: item.id,
        itemRefNo: item.itemRefNo,
        category: item.category,
        subcategory: item.subcategory,
        detailedDescription: item.detailedDescription,
        opsBriskCost: item.opsBriskCost,
        standardCost: item.standardCost,
        quantity: Number(item.quantity),
        duration: Number(item.duration),
      }))
    );
    toast.success('Standard costs reset to original values');
  };

  const handleExportExcel = () => {
    try {
      const excelData = analysisData.items.map((item, index) => ({
        'S.No': index + 1,
        'Item Ref No': item.itemRefNo,
        'Category': item.category,
        'Subcategory': item.subcategory,
        'Description': item.detailedDescription || '—',
        'Quantity': item.quantity,
        'Duration': item.duration,
        'Ops Brisk Cost': item.opsBriskCost,
        'Standard Cost': item.standardCost,
        'Margin': item.margin,
        'Margin %': item.marginPercentage.toFixed(1) + '%',
        'Total Revenue': item.total,
        'Total Profit': item.totalMargin,
      }));

      // Add summary rows
      excelData.push({} as any);
      excelData.push({
        'S.No': '',
        'Item Ref No': '',
        'Category': '',
        'Subcategory': '',
        'Description': '',
        'Quantity': '',
        'Duration': '',
        'Ops Brisk Cost': '',
        'Standard Cost': '',
        'Margin': '',
        'Margin %': 'Total Revenue:',
        'Total Revenue': analysisData.totalRevenue,
        'Total Profit': '',
      } as any);
      excelData.push({
        'S.No': '',
        'Item Ref No': '',
        'Category': '',
        'Subcategory': '',
        'Description': '',
        'Quantity': '',
        'Duration': '',
        'Ops Brisk Cost': '',
        'Standard Cost': '',
        'Margin': '',
        'Margin %': 'Total Cost:',
        'Total Revenue': analysisData.totalCost,
        'Total Profit': '',
      } as any);
      excelData.push({
        'S.No': '',
        'Item Ref No': '',
        'Category': '',
        'Subcategory': '',
        'Description': '',
        'Quantity': '',
        'Duration': '',
        'Ops Brisk Cost': '',
        'Standard Cost': '',
        'Margin': '',
        'Margin %': 'Total Profit:',
        'Total Revenue': analysisData.totalProfit,
        'Total Profit': '',
      } as any);
      excelData.push({
        'S.No': '',
        'Item Ref No': '',
        'Category': '',
        'Subcategory': '',
        'Description': '',
        'Quantity': '',
        'Duration': '',
        'Ops Brisk Cost': '',
        'Standard Cost': '',
        'Margin': '',
        'Margin %': 'Overall Margin %:',
        'Total Revenue': analysisData.overallMarginPercentage.toFixed(1) + '%',
        'Total Profit': '',
      } as any);

      const filename = `analysis_${quote.header.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(excelData, filename);
      toast.success('Analysis exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error((error as Error).message || 'Failed to export to Excel. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      const pdfData = {
        header: quote.header,
        items: analysisData.items.map((item) => ({
          itemRefNo: item.itemRefNo,
          category: item.category,
          subcategory: item.subcategory,
          detailedDescription: item.detailedDescription,
          quantity: item.quantity,
          duration: item.duration,
          opsBriskCost: item.opsBriskCost,
          standardCost: item.standardCost,
          margin: item.margin,
          marginPercentage: item.marginPercentage,
          total: item.total,
          totalMargin: item.totalMargin,
        })),
        totalRevenue: analysisData.totalRevenue,
        totalCost: analysisData.totalCost,
        totalProfit: analysisData.totalProfit,
        overallMarginPercentage: analysisData.overallMarginPercentage,
        date: new Date().toLocaleDateString(),
      };

      const filename = `analysis_${quote.header.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      exportToPDF(pdfData, filename, true);
      toast.success('Analysis exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error((error as Error).message || 'Failed to export to PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(analysisData.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on standard costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(analysisData.totalProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: {formatPercentage(analysisData.overallMarginPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-warning" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCurrency(analysisData.totalCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ops brisk costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cost Analysis
              </CardTitle>
              <CardDescription>Review margins and adjust standard costs inline</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleUpdateCosts}
                disabled={isUpdating}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Update Costs'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetCosts}>
                Reset
              </Button>
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Ref No</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Ops Brisk Cost</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemRefNo}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.detailedDescription}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.duration)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.opsBriskCost)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.standardCost}
                        onChange={(e) => handleStandardCostChange(index, parseFloat(e.target.value) || 0)}
                        className="w-32 text-right font-mono print:border-0 print:p-0"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.margin >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(item.margin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.marginPercentage >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatPercentage(item.marginPercentage)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.total)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.totalMargin >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(item.totalMargin)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className="text-right font-semibold">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(analysisData.totalRevenue)}</TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={analysisData.totalProfit >= 0 ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(analysisData.totalProfit)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-semibold mb-3">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-mono font-semibold">{formatCurrency(analysisData.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-mono font-semibold">{formatCurrency(analysisData.totalCost)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Profit:</span>
                  <span className={`font-mono font-semibold ${analysisData.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(analysisData.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Margin:</span>
                  <span className={`font-mono font-semibold ${analysisData.overallMarginPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(analysisData.overallMarginPercentage)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
