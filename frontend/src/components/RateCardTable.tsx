import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RateCardItem } from '../backend';

interface RateCardTableProps {
  items: RateCardItem[];
}

export default function RateCardTable({ items }: RateCardTableProps) {
  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[12%]">Item Ref No</TableHead>
            <TableHead className="w-[15%]">Category</TableHead>
            <TableHead className="w-[15%]">Subcategory</TableHead>
            <TableHead className="w-[35%]">Detailed Description</TableHead>
            <TableHead className="w-[11.5%] text-right">Ops Brisk Cost</TableHead>
            <TableHead className="w-[11.5%] text-right">Standard Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.itemRefNo}</TableCell>
              <TableCell>{item.category || '—'}</TableCell>
              <TableCell>{item.subcategory || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{item.detailedDescription || '—'}</TableCell>
              <TableCell className="text-right font-mono">Kshs {item.opsBriskCost.toFixed(2)}</TableCell>
              <TableCell className="text-right font-mono">Kshs {item.standardCost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
