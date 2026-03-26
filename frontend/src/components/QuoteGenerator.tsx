import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, Trash2, FileText, Search, RotateCcw, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useGetRateCard, useGenerateFullQuote, useGetAccountManagers, useGenerateAnalysis } from '../hooks/useQueries';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import QuoteSummary from './QuoteSummary';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';
import type { FullQuote, QuoteHeader, RateCardItem, AnalysisSummary } from '../backend';

interface SelectedItem {
  id: string;
  quantity: number;
  duration: number;
}

interface QuoteGeneratorProps {
  onQuoteGenerated?: (quote: FullQuote | null) => void;
}

export default function QuoteGenerator({ onQuoteGenerated }: QuoteGeneratorProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [generatedQuote, setGeneratedQuote] = useState<FullQuote | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterDescription, setFilterDescription] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisSummary | null>(null);

  // Header fields
  const [clientName, setClientName] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [accountManager, setAccountManager] = useState('');
  const [projectName, setProjectName] = useState('');

  const { data: rateCard, isLoading: isLoadingRateCard } = useGetRateCard();
  const { data: accountManagerList } = useGetAccountManagers();
  const { mutate: generateFullQuote, isPending: isGenerating } = useGenerateFullQuote();
  const { mutate: generateAnalysis, isPending: isAnalyzing } = useGenerateAnalysis();

  const accountManagers = accountManagerList?.managers || [];

  // Get unique categories
  const categories = useMemo(() => {
    if (!rateCard) return [];
    const uniqueCategories = Array.from(new Set(rateCard.items.map((item) => item.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [rateCard]);

  // Get subcategories based on selected category
  const subcategories = useMemo(() => {
    if (!rateCard || filterCategory === 'all') return [];
    const filtered = rateCard.items.filter((item) => item.category === filterCategory);
    const uniqueSubcategories = Array.from(new Set(filtered.map((item) => item.subcategory).filter(Boolean)));
    return uniqueSubcategories.sort();
  }, [rateCard, filterCategory]);

  // Get descriptions based on selected category and subcategory
  const descriptions = useMemo(() => {
    if (!rateCard || filterCategory === 'all' || filterSubcategory === 'all') return [];
    const filtered = rateCard.items.filter(
      (item) => item.category === filterCategory && item.subcategory === filterSubcategory
    );
    return filtered.map((item) => ({
      id: item.id,
      description: item.detailedDescription,
      itemRefNo: item.itemRefNo,
    }));
  }, [rateCard, filterCategory, filterSubcategory]);

  // Filter available items
  const filteredItems = useMemo(() => {
    if (!rateCard) return [];
    return rateCard.items.filter((item) => !selectedItems.some((si) => si.id === item.id));
  }, [rateCard, selectedItems]);

  // Calculate live totals for preview table
  const liveQuoteData = useMemo(() => {
    if (!rateCard) return { items: [], total: 0 };

    const items = selectedItems
      .filter((item) => item.id)
      .map((item) => {
        const rateItem = rateCard.items.find((r) => r.id === item.id);
        if (!rateItem) return null;

        const total = rateItem.standardCost * item.quantity * item.duration;
        return {
          ...rateItem,
          quantity: item.quantity,
          duration: item.duration,
          total,
        };
      })
      .filter(Boolean) as (RateCardItem & { quantity: number; duration: number; total: number })[];

    const total = items.reduce((sum, item) => sum + item.total, 0);

    return { items, total };
  }, [selectedItems, rateCard]);

  const handleAddItem = () => {
    if (filterCategory === 'all') {
      toast.error('Please select a category first');
      return;
    }
    if (filterSubcategory === 'all') {
      toast.error('Please select a subcategory first');
      return;
    }
    if (!filterDescription) {
      toast.error('Please select a description first');
      return;
    }

    const existingItem = selectedItems.find((item) => item.id === filterDescription);
    if (existingItem) {
      toast.error('This item is already added to the quote');
      return;
    }

    setSelectedItems([...selectedItems, { id: filterDescription, quantity: 1, duration: 1 }]);
    setFilterDescription('');
    setAnalysisData(null); // Clear analysis when items change
    toast.success('Item added to quote');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
    setAnalysisData(null); // Clear analysis when items change
    toast.success('Item removed from quote');
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = Math.max(1, quantity);
    setSelectedItems(newItems);
    setAnalysisData(null); // Clear analysis when items change
  };

  const handleDurationChange = (index: number, duration: number) => {
    const newItems = [...selectedItems];
    newItems[index].duration = Math.max(1, duration);
    setSelectedItems(newItems);
    setAnalysisData(null); // Clear analysis when items change
  };

  const handleReset = () => {
    setSelectedItems([]);
    setClientName('');
    setProjectDuration('');
    setAccountManager('');
    setProjectName('');
    setFilterCategory('all');
    setFilterSubcategory('all');
    setFilterDescription('');
    setAnalysisData(null);
    toast.success('Quote fields cleared');
  };

  const handleAnalyzeQuote = () => {
    const validItems = selectedItems.filter((item) => item.id && item.quantity > 0 && item.duration > 0);

    if (validItems.length === 0) {
      toast.error('Please add at least one item to analyze');
      return;
    }

    const quoteItems: [string, bigint, bigint][] = validItems.map((item) => [
      item.id,
      BigInt(item.quantity),
      BigInt(item.duration),
    ]);

    generateAnalysis(quoteItems, {
      onSuccess: (analysis) => {
        setAnalysisData(analysis);
        toast.success('Analysis generated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to generate analysis: ' + error.message);
      },
    });
  };

  const handleGenerateQuote = () => {
    const validItems = selectedItems.filter((item) => item.id && item.quantity > 0 && item.duration > 0);

    if (validItems.length === 0) {
      toast.error('Please add at least one item to generate a quote');
      return;
    }

    if (!clientName.trim() || !projectDuration.trim() || !accountManager.trim() || !projectName.trim()) {
      toast.error('Please fill in all header fields');
      return;
    }

    const header: QuoteHeader = {
      clientName: clientName.trim(),
      projectDuration: projectDuration.trim(),
      accountManager: accountManager.trim(),
      projectName: projectName.trim(),
    };

    const quoteItems: [string, bigint, bigint][] = validItems.map((item) => [
      item.id,
      BigInt(item.quantity),
      BigInt(item.duration),
    ]);

    generateFullQuote(
      { header, selectedItems: quoteItems },
      {
        onSuccess: (quote) => {
          setGeneratedQuote(quote);
          if (onQuoteGenerated) {
            onQuoteGenerated(quote);
          }
          toast.success('Quote generated successfully!');
        },
        onError: (error) => {
          toast.error('Failed to generate quote: ' + error.message);
        },
      }
    );
  };

  const handleNewQuote = () => {
    setGeneratedQuote(null);
    setSelectedItems([]);
    setClientName('');
    setProjectDuration('');
    setAccountManager('');
    setProjectName('');
    setFilterCategory('all');
    setFilterSubcategory('all');
    setFilterDescription('');
    setAnalysisData(null);
    if (onQuoteGenerated) {
      onQuoteGenerated(null);
    }
  };

  if (generatedQuote) {
    return <QuoteSummary quote={generatedQuote} onNewQuote={handleNewQuote} />;
  }

  if (isLoadingRateCard) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rateCard || rateCard.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Rate Card Available</h3>
          <p className="text-muted-foreground">
            {rateCard ? 'The rate card is empty. ' : ''}
            Please contact an administrator to upload a rate card.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Create New Quote
              </CardTitle>
              <CardDescription>Fill in project details and select items to generate a quote</CardDescription>
            </div>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Section */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <h3 className="font-semibold text-sm">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="accountManager">Account Manager *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {accountManager || 'Select account manager'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search account managers..." />
                      <CommandList>
                        <CommandEmpty>No account manager found.</CommandEmpty>
                        <CommandGroup>
                          {accountManagers.map((manager) => (
                            <CommandItem key={manager.id} onSelect={() => setAccountManager(manager.name)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{manager.name}</span>
                                {manager.email && (
                                  <span className="text-xs text-muted-foreground">{manager.email}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="projectDuration">Project Duration *</Label>
                <Input
                  id="projectDuration"
                  value={projectDuration}
                  onChange={(e) => setProjectDuration(e.target.value)}
                  placeholder="e.g., 6 months, Q1 2025"
                />
              </div>
            </div>
          </div>

          {/* Hierarchical Search Section */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Items (Hierarchical)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>1. Category</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {filterCategory === 'all' ? 'Select Category' : filterCategory}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat}
                              onSelect={() => {
                                setFilterCategory(cat);
                                setFilterSubcategory('all');
                                setFilterDescription('');
                              }}
                            >
                              {cat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>2. Sub-category</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={filterCategory === 'all'}
                    >
                      {filterSubcategory === 'all' ? 'Select Sub-category' : filterSubcategory}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search sub-categories..." />
                      <CommandList>
                        <CommandEmpty>No sub-category found.</CommandEmpty>
                        <CommandGroup>
                          {subcategories.map((subcat) => (
                            <CommandItem
                              key={subcat}
                              onSelect={() => {
                                setFilterSubcategory(subcat);
                                setFilterDescription('');
                              }}
                            >
                              {subcat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>3. Detailed Description</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={filterSubcategory === 'all'}
                    >
                      {filterDescription
                        ? descriptions.find((d) => d.id === filterDescription)?.description || 'Select Description'
                        : 'Select Description'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-white" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search descriptions..." />
                      <CommandList>
                        <CommandEmpty>No description found.</CommandEmpty>
                        <CommandGroup>
                          {descriptions.map((desc) => (
                            <CommandItem key={desc.id} onSelect={() => setFilterDescription(desc.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{desc.itemRefNo}</span>
                                <span className="text-sm">{desc.description}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleAddItem} disabled={!filterDescription}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item to Quote
            </Button>
          </div>

          {/* Live Quote Preview Table */}
          {liveQuoteData.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Quote Preview</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Ref No.</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Sub-category</TableHead>
                      <TableHead>Detailed Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveQuoteData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.itemRefNo}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.subcategory}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.detailedDescription}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.duration}
                            onChange={(e) => handleDurationChange(index, parseInt(e.target.value) || 1)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.standardCost)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.total)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="text-right font-semibold">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(liveQuoteData.total)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          )}

          {/* Analysis Summary Panel */}
          {analysisData && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Quote Analysis Summary</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(analysisData.totalProfit)}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Total Margin</span>
                  </div>
                  <p className="text-2xl font-bold text-success">{formatCurrency(analysisData.totalMargin)}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Margin %</span>
                  </div>
                  <p className="text-2xl font-bold text-warning">
                    {analysisData.totalProfit > 0 
                      ? formatPercentage((analysisData.totalMargin / analysisData.totalProfit) * 100)
                      : '0.0%'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h4 className="font-semibold mb-3 text-sm">Item Breakdown</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {analysisData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemRefNo}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {item.detailedDescription}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{formatCurrency(item.total)}</p>
                        <p className={`text-xs font-mono ${item.marginPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatPercentage(item.marginPercentage)} margin
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">
                  Review the analysis to ensure the quote meets your margin requirements before finalizing.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleAnalyzeQuote} 
              disabled={isAnalyzing || selectedItems.length === 0}
              variant="outline"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Quote'}
            </Button>
            <Button onClick={handleGenerateQuote} disabled={isGenerating || selectedItems.length === 0}>
              <Calculator className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Quote'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
