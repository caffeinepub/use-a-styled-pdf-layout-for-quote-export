import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Eye, FileText, Loader2 } from 'lucide-react';
import { useGetQuoteHistory } from '../hooks/useQueries';
import { formatCurrency, formatNumber } from '../lib/formatters';
import type { FullQuote, QuoteHistoryItem } from '../backend';

interface QuoteHistoryTabProps {
  onLoadQuote: (quote: FullQuote) => void;
}

export default function QuoteHistoryTab({ onLoadQuote }: QuoteHistoryTabProps) {
  const { data: history, isLoading } = useGetQuoteHistory();

  const handleViewQuote = (historyItem: QuoteHistoryItem) => {
    const fullQuote: FullQuote = {
      header: historyItem.header,
      items: historyItem.items,
      total: historyItem.total,
    };
    onLoadQuote(fullQuote);
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h3 className="text-lg font-semibold mb-2">No Quote History</h3>
          <p className="text-muted-foreground">
            Generate your first quote to see it appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by timestamp descending (newest first)
  const sortedHistory = [...history].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Quotes History
        </CardTitle>
        <CardDescription>
          View and reload previously generated quotes ({history.length} total)
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
                <TableRow key={item.id}>
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
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewQuote(item)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
