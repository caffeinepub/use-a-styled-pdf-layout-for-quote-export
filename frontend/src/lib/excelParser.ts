// Excel file parser using SheetJS (loaded via CDN)
// This utility handles parsing of .xlsx files in the browser

export interface ParsedExcelData {
  itemRefNo: string;
  category: string;
  subcategory: string;
  detailedDescription: string;
  opsBriskCost: number;
  standardCost: number;
}

declare global {
  interface Window {
    XLSX: any;
  }
}

export async function parseExcelFile(file: File): Promise<ParsedExcelData[]> {
  // Check if XLSX library is loaded
  if (typeof window.XLSX === 'undefined') {
    throw new Error('Excel parser library not loaded. Please refresh the page.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row'));
          return;
        }

        // Get headers from first row
        const headers = (jsonData[0] as any[]).map((h) => h?.toString().trim().toLowerCase());
        
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
          reject(new Error('Excel file must contain columns: itemRefNo, category, subcategory, detailedDescription, opsBriskCost, standardCost'));
          return;
        }

        // Parse rows (skip header)
        const items: ParsedExcelData[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          if (!row || row.length === 0) continue;
          
          const itemRefNo = row[itemRefNoIdx]?.toString().trim();
          const category = row[categoryIdx]?.toString().trim() || '';
          const subcategory = row[subcategoryIdx]?.toString().trim() || '';
          const detailedDescription = row[detailedDescriptionIdx]?.toString().trim() || '';
          const opsBriskCostStr = row[opsBriskCostIdx]?.toString().trim();
          const standardCostStr = row[standardCostIdx]?.toString().trim();
          
          if (!itemRefNo || !opsBriskCostStr || !standardCostStr) continue;
          
          const opsBriskCost = parseFloat(opsBriskCostStr);
          const standardCost = parseFloat(standardCostStr);
          
          if (isNaN(opsBriskCost) || isNaN(standardCost)) {
            console.warn(`Invalid cost on row ${i + 1}: opsBriskCost="${opsBriskCostStr}", standardCost="${standardCostStr}"`);
            continue;
          }
          
          items.push({ 
            itemRefNo, 
            category, 
            subcategory, 
            detailedDescription, 
            opsBriskCost, 
            standardCost 
          });
        }

        if (items.length === 0) {
          reject(new Error('No valid items found in the Excel file'));
          return;
        }

        resolve(items);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data: any[], filename: string): void {
  if (typeof window.XLSX === 'undefined') {
    throw new Error('Excel export library not loaded. Please refresh the page.');
  }

  // Create a new workbook
  const wb = window.XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = window.XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  window.XLSX.utils.book_append_sheet(wb, ws, 'Quote');
  
  // Generate Excel file and trigger download
  window.XLSX.writeFile(wb, filename);
}
