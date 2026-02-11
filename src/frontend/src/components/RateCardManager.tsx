import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetRateCard, useUpdateRateCard } from '../hooks/useQueries';
import type { RateCardItem } from '../backend';
import RateCardPreview from './RateCardPreview';
import RateCardTable from './RateCardTable';
import { parseExcelFile } from '../lib/excelParser';

export default function RateCardManager() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<RateCardItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: rateCard, isLoading: isLoadingRateCard } = useGetRateCard();
  const { mutate: updateRateCard, isPending: isUpdating } = useUpdateRateCard();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
        toast.error('Please upload a CSV or Excel (.xlsx) file');
        return;
      }
      
      setFile(selectedFile);
      
      if (fileExtension === 'xlsx') {
        parseExcelFileHandler(selectedFile);
      } else {
        parseCSVFile(selectedFile);
      }
    }
  };

  const parseExcelFileHandler = async (file: File) => {
    try {
      const parsedItems = await parseExcelFile(file);
      
      const items: RateCardItem[] = parsedItems.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        itemRefNo: item.itemRefNo,
        category: item.category,
        subcategory: item.subcategory,
        detailedDescription: item.detailedDescription,
        opsBriskCost: item.opsBriskCost,
        standardCost: item.standardCost,
      }));

      setParsedData(items);
      setShowPreview(true);
      toast.success(`Parsed ${items.length} items from Excel file`);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error((error as Error).message || 'Failed to parse Excel file');
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error('CSV file must contain at least a header row and one data row');
          return;
        }

        // Get headers from first row
        const headerLine = lines[0].trim();
        const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());
        
        // Find column indices
        const itemRefNoIdx = headers.findIndex((h) => h === 'itemrefno' || h === 'item ref no' || h === 'item reference number');
        const categoryIdx = headers.findIndex((h) => h === 'category');
        const subcategoryIdx = headers.findIndex((h) => h === 'subcategory' || h === 'sub category');
        const detailedDescriptionIdx = headers.findIndex((h) => h === 'detaileddescription' || h === 'detailed description' || h === 'description');
        const opsBriskCostIdx = headers.findIndex((h) => h === 'opsbriskcost' || h === 'ops brisk cost' || h === 'brisk cost');
        const standardCostIdx = headers.findIndex((h) => h === 'standardcost' || h === 'standard cost' || h === 'cost');

        // Validate required columns
        if (itemRefNoIdx === -1 || categoryIdx === -1 || subcategoryIdx === -1 || 
            detailedDescriptionIdx === -1 || opsBriskCostIdx === -1 || standardCostIdx === -1) {
          toast.error('CSV file must contain columns: itemRefNo, category, subcategory, detailedDescription, opsBriskCost, standardCost');
          return;
        }

        // Parse CSV data
        const items: RateCardItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCSVLine(line);

          const itemRefNo = values[itemRefNoIdx]?.trim();
          const category = values[categoryIdx]?.trim() || '';
          const subcategory = values[subcategoryIdx]?.trim() || '';
          const detailedDescription = values[detailedDescriptionIdx]?.trim() || '';
          const opsBriskCostStr = values[opsBriskCostIdx]?.trim();
          const standardCostStr = values[standardCostIdx]?.trim();

          if (!itemRefNo || !opsBriskCostStr || !standardCostStr) continue;

          const opsBriskCost = parseFloat(opsBriskCostStr);
          const standardCost = parseFloat(standardCostStr);
          
          if (isNaN(opsBriskCost) || isNaN(standardCost)) {
            toast.error(`Invalid cost on line ${i + 1}: opsBriskCost="${opsBriskCostStr}", standardCost="${standardCostStr}"`);
            continue;
          }

          items.push({
            id: `item-${Date.now()}-${i}`,
            itemRefNo,
            category,
            subcategory,
            detailedDescription,
            opsBriskCost,
            standardCost,
          });
        }

        if (items.length === 0) {
          toast.error('No valid items found in the CSV file');
          return;
        }

        setParsedData(items);
        setShowPreview(true);
        toast.success(`Parsed ${items.length} items from CSV file`);
      } catch (error) {
        console.error('Error parsing CSV file:', error);
        toast.error('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsText(file);
  };

  // Simple CSV line parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const handleConfirmUpdate = () => {
    updateRateCard(parsedData, {
      onSuccess: () => {
        toast.success('Rate card updated successfully!');
        setShowPreview(false);
        setFile(null);
        setParsedData([]);
      },
      onError: (error) => {
        toast.error('Failed to update rate card: ' + error.message);
      },
    });
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setFile(null);
    setParsedData([]);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'itemRefNo,category,subcategory,detailedDescription,opsBriskCost,standardCost\nCS-001,Consulting,Strategy,Professional consulting services,120.00,150.00\nWD-001,Development,Web,Custom website development,2000.00,2500.00\nDG-001,Design,Branding,Professional logo design,400.00,500.00';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rate_card_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showPreview) {
    return (
      <RateCardPreview
        items={parsedData}
        onConfirm={handleConfirmUpdate}
        onCancel={handleCancelPreview}
        isUpdating={isUpdating}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Rate Card
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel (.xlsx) file to update the master rate card database. The file should have six columns: Item Ref No, Category, Subcategory, Detailed Description, Ops Brisk Cost, and Standard Cost.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>File Format:</strong> itemRefNo | category | subcategory | detailedDescription | opsBriskCost | standardCost
              <br />
              The first row should contain headers and will be skipped during import.
              <br />
              <strong>Supported formats:</strong> CSV (.csv) and Excel (.xlsx)
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild variant="outline" className="w-full cursor-pointer">
                    <span>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {file ? file.name : 'Choose CSV or Excel File'}
                    </span>
                  </Button>
                </label>
              </div>
              <Button variant="secondary" onClick={handleDownloadTemplate}>
                Download Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Rate Card Database
          </CardTitle>
          <CardDescription>View all items in the current master rate card database</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRateCard ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rateCard && rateCard.items.length > 0 ? (
            <RateCardTable items={rateCard.items} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items in the rate card database. Upload a CSV or Excel file to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
