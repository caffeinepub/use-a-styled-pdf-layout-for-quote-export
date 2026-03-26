import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, Users, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAccountManagers, useUpdateAccountManagers, useAddAccountManager, useDeleteAccountManager } from '../hooks/useQueries';
import { parseAccountManagerFile } from '../lib/accountManagerParser';
import type { AccountManager } from '../backend';

export default function AccountManagerManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: accountManagerList, isLoading } = useGetAccountManagers();
  const { mutate: updateAccountManagers } = useUpdateAccountManagers();
  const { mutate: addAccountManager, isPending: isAdding } = useAddAccountManager();
  const { mutate: deleteAccountManager } = useDeleteAccountManager();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedManagers = await parseAccountManagerFile(file);
      
      // Generate IDs for new managers
      const managersWithIds: AccountManager[] = parsedManagers.map((manager, index) => ({
        id: `am_${Date.now()}_${index}`,
        name: manager.name,
        email: manager.email || undefined,
      }));

      updateAccountManagers(managersWithIds, {
        onSuccess: () => {
          toast.success(`Successfully uploaded ${managersWithIds.length} account manager(s)`);
          event.target.value = '';
        },
        onError: (error) => {
          toast.error('Failed to upload account managers: ' + error.message);
        },
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Email\nJohn Doe,john.doe@example.com\nJane Smith,jane.smith@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'account_managers_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  const handleAddManager = () => {
    if (!newManagerName.trim()) {
      toast.error('Please enter a manager name');
      return;
    }

    const newManager: AccountManager = {
      id: `am_${Date.now()}`,
      name: newManagerName.trim(),
      email: newManagerEmail.trim() || undefined,
    };

    addAccountManager(newManager, {
      onSuccess: () => {
        toast.success('Account manager added successfully');
        setNewManagerName('');
        setNewManagerEmail('');
        setShowAddForm(false);
      },
      onError: (error) => {
        toast.error('Failed to add account manager: ' + error.message);
      },
    });
  };

  const handleDeleteManager = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    deleteAccountManager(id, {
      onSuccess: () => {
        toast.success('Account manager deleted successfully');
      },
      onError: (error) => {
        toast.error('Failed to delete account manager: ' + error.message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const managers = accountManagerList?.managers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Resource Management - Account Managers
        </CardTitle>
        <CardDescription>
          Upload and manage your list of account managers for quote generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="flex flex-wrap gap-3">
          <div>
            <Input
              id="account-manager-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Label htmlFor="account-manager-upload">
              <Button variant="default" disabled={isUploading} asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Excel/CSV'}
                </span>
              </Button>
            </Label>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </div>

        {/* Manual Add Form */}
        {showAddForm && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <h3 className="font-semibold text-sm">Add Account Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manager-name">Name *</Label>
                <Input
                  id="manager-name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="Enter manager name"
                />
              </div>
              <div>
                <Label htmlFor="manager-email">Email (Optional)</Label>
                <Input
                  id="manager-email"
                  type="email"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddManager} disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Manager'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Account Managers List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">
            Account Managers ({managers.length})
          </h3>
          {managers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No account managers found. Upload a file or add manually to get started.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell className="font-medium">{manager.name}</TableCell>
                      <TableCell>{manager.email || '—'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteManager(manager.id, manager.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
