import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Calculator, BarChart3, History, FileText, Settings } from 'lucide-react';
import RateCardManager from './RateCardManager';
import QuoteGenerator from './QuoteGenerator';
import AnalysisTab from './AnalysisTab';
import QuoteHistoryTab from './QuoteHistoryTab';
import ReportsTab from './ReportsTab';
import SettingsTab from './SettingsTab';
import type { FullQuote } from '../backend';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('quote');
  const [currentQuote, setCurrentQuote] = useState<FullQuote | null>(null);

  const handleQuoteGenerated = (quote: FullQuote | null) => {
    setCurrentQuote(quote);
    if (quote) {
      setActiveTab('analysis');
    }
  };

  const handleLoadQuote = (quote: FullQuote) => {
    setCurrentQuote(quote);
    setActiveTab('analysis');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-6 mb-8">
          <TabsTrigger value="quote" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Quote Generator
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!currentQuote}>
            <BarChart3 className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Quotes History
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="ratecard" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Rate Card
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quote" className="mt-0">
          <QuoteGenerator onQuoteGenerated={handleQuoteGenerated} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-0">
          {currentQuote ? (
            <AnalysisTab quote={currentQuote} onQuoteUpdated={setCurrentQuote} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Generate a quote first to view analysis
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <QuoteHistoryTab onLoadQuote={handleLoadQuote} />
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="ratecard" className="mt-0">
          <RateCardManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
