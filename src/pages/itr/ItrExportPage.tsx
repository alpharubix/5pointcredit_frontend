import { useState } from 'react';
import { downloadItrReport } from '@/api/itr';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Loader2,
  Calculator,
  Building,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ItrExportPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      toast.loading(
        'Downloading ITR Report (Tax Calculation, Balance Sheet, Profit & Loss, Ratio Analysis)...',
        { id: 'itr-export-page' }
      );
      await downloadItrReport();
      toast.success('ITR Report downloaded successfully!', {
        id: 'itr-export-page',
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download ITR report', {
        id: 'itr-export-page',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const reports = [
    {
      title: 'Tax Calculation',
      description: 'Detailed computation of tax liability, TDS, TCS and total income tax breakdown.',
      icon: Calculator,
      badge: 'Included',
    },
    {
      title: 'Balance Sheet',
      description: 'Complete assets, liabilities, capital account, and balance sheet financial statement.',
      icon: Building,
      badge: 'Included',
    },
    {
      title: 'Profit and Loss Statement',
      description: 'Trading account, operating revenue, gross profit, and net profit analysis.',
      icon: TrendingUp,
      badge: 'Included',
    },
    {
      title: 'Ratio Analysis',
      description: 'Liquidity, profitability, leverage, coverage ratios, and cashflow margins.',
      icon: BarChart3,
      badge: 'Included',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#002366]/10 text-[#002366] rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                ITR Report Export
              </h1>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Export and download all 4 core ITR financial statements (Tax Calculation, Balance Sheet, Profit & Loss Statement, and Ratio Analysis) in a consolidated report.
            </p>
          </div>

          <Button
            onClick={handleDownload}
            disabled={isExporting}
            size="lg"
            className="bg-[#002366] hover:bg-[#001845] text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Downloading Report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export Full ITR Report
              </>
            )}
          </Button>
        </div>

        {/* Report Components Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Statements Included in Export
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.title} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-[#002366] rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {report.title}
                        </CardTitle>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      {report.badge}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs text-slate-500 leading-relaxed">
                      {report.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Information Callout */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <FileText className="h-5 w-5 text-[#002366] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Note: Clicking <strong className="text-slate-900">Export Full ITR Report</strong> requests the consolidated report from the backend API (<code className="bg-blue-100/70 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]">/v1/itr/export-report</code>) and triggers a direct file download containing Tax Calculation, Balance Sheet, Profit & Loss Statement, and Ratio Analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
