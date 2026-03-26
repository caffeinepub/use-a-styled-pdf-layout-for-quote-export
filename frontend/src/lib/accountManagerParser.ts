// Account Manager file parser for Excel and CSV files

export interface ParsedAccountManager {
  name: string;
  email?: string;
}

declare global {
  interface Window {
    XLSX: any;
  }
}

export async function parseAccountManagerFile(file: File): Promise<ParsedAccountManager[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    return parseCSV(file);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
}

async function parseCSV(file: File): Promise<ParsedAccountManager[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'));
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const nameIdx = headers.findIndex((h) => h === 'name');
        const emailIdx = headers.findIndex((h) => h === 'email');

        if (nameIdx === -1) {
          reject(new Error('CSV file must contain a "Name" column'));
          return;
        }

        // Parse data rows
        const managers: ParsedAccountManager[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const name = values[nameIdx];
          const email = emailIdx !== -1 ? values[emailIdx] : undefined;

          if (name) {
            managers.push({ name, email: email || undefined });
          }
        }

        if (managers.length === 0) {
          reject(new Error('No valid account managers found in the CSV file'));
          return;
        }

        resolve(managers);
      } catch (error) {
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

async function parseExcel(file: File): Promise<ParsedAccountManager[]> {
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

        const nameIdx = headers.findIndex((h) => h === 'name');
        const emailIdx = headers.findIndex((h) => h === 'email');

        if (nameIdx === -1) {
          reject(new Error('Excel file must contain a "Name" column'));
          return;
        }

        // Parse rows (skip header)
        const managers: ParsedAccountManager[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];

          if (!row || row.length === 0) continue;

          const name = row[nameIdx]?.toString().trim();
          const email = emailIdx !== -1 ? row[emailIdx]?.toString().trim() : undefined;

          if (name) {
            managers.push({ name, email: email || undefined });
          }
        }

        if (managers.length === 0) {
          reject(new Error('No valid account managers found in the Excel file'));
          return;
        }

        resolve(managers);
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
