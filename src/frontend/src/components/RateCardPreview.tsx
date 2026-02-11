import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RateCardItem } from '../backend';
import RateCardTable from './RateCardTable';

interface RateCardPreviewProps {
  items: RateCardItem[];
  onConfirm: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export default function RateCardPreview({ items, onConfirm, onCancel, isUpdating }: RateCardPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Preview Rate Card Update
        </CardTitle>
        <CardDescription>
          Review the parsed data before updating the rate card. This will replace all existing items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Confirming this update will permanently replace all existing rate card items
            with the {items.length} items shown below.
          </AlertDescription>
        </Alert>

        <RateCardTable items={items} />
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isUpdating}>
          <Check className="mr-2 h-4 w-4" />
          {isUpdating ? 'Updating...' : 'Confirm Update'}
        </Button>
      </CardFooter>
    </Card>
  );
}
