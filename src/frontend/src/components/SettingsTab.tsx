import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import AccountManagerManager from './AccountManagerManager';

export default function SettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>Manage application settings and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <AccountManagerManager />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
