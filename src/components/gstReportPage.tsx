import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Loader2, Download } from "lucide-react";
import GstOverviewTab from "./gst-reports/GstOverviewTab";
import TopSuppliersCustomersTab from "./gst-reports/TopSuppliersCustomersTab";
import MonthlySummaryTab from "./gst-reports/MonthlySummaryTab";
import { downloadGstReport } from "@/api/gst";
import { toast } from "sonner";

export default function GstReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { gst_reference_id?: string };
  const gstReferenceId = state?.gst_reference_id;
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading('Downloading GST Report...', { id: 'gst-export' });
      await downloadGstReport(gstReferenceId);
      toast.success('GST Report downloaded successfully!', { id: 'gst-export' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download GST report', { id: 'gst-export' });
    } finally {
      setIsExporting(false);
    }
  };

  if (!gstReferenceId) {
    return <Navigate to="/gst/history" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/gst/history")}
              className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GST Report</h1>
              <p className="text-gray-500 mt-1">Ref ID: {gstReferenceId}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#002366] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#001a4d] hover:shadow-sm cursor-pointer disabled:opacity-50"
            title="Download GSTR Report (Overview, Top Suppliers & Customers, Monthly Summary)"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Download className="h-4 w-4 text-emerald-400" />
            )}
            <span>Export </span>
          </button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border border-gray-100 p-1 rounded-lg h-auto shadow-sm">
            <TabsTrigger value="overview" className="py-2.5 data-[state=active]:bg-[#000080] data-[state=active]:text-white">
              GST Overview
            </TabsTrigger>
            <TabsTrigger value="suppliers-customers" className="py-2.5 data-[state=active]:bg-[#000080] data-[state=active]:text-white">
              Top Suppliers & Customers
            </TabsTrigger>
            <TabsTrigger value="monthly-summary" className="py-2.5 data-[state=active]:bg-[#000080] data-[state=active]:text-white">
              Monthly Sales & Purchase Summary
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="outline-none focus:outline-none">
            <GstOverviewTab gstReferenceId={gstReferenceId} />
          </TabsContent>
          <TabsContent value="suppliers-customers" className="outline-none focus:outline-none">
            <TopSuppliersCustomersTab gstReferenceId={gstReferenceId} />
          </TabsContent>
          <TabsContent value="monthly-summary" className="outline-none focus:outline-none">
            <MonthlySummaryTab gstReferenceId={gstReferenceId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
