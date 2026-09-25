import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CibilReportTabs from "@/components/cibil/CibilReportTabs";
import { Loader2, Download } from "lucide-react";
import { downloadCibilReport } from "@/api/cibil";
import { toast } from "sonner";

type ViewReportProps = {
  reference_id?: string;
  onBack?: () => void;
  onStartNew?: () => void;
};

export default function ViewReport({
  reference_id: propReferenceId,
  onBack,
  onStartNew,
}: ViewReportProps = {}) {
  const { reference_id: routeReferenceId } = useParams<{ reference_id: string }>();
  const navigate = useNavigate();
  const referenceId = propReferenceId || routeReferenceId;
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = "View CIBIL Report";
  }, []);

  const handleExport = async () => {
    if (!referenceId) return;
    try {
      setIsExporting(true);
      toast.loading('Downloading CIBIL report...', { id: 'cibil-export' });
      await downloadCibilReport(referenceId);
      toast.success('CIBIL report downloaded successfully!', { id: 'cibil-export' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download CIBIL report', { id: 'cibil-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate("/cibil/reports");
  };

  const handleStartNew = () => {
    if (onStartNew) {
      onStartNew();
      return;
    }

    navigate("/cibil");
  };

  if (!referenceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10 flex items-center justify-center">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 text-red-700 shadow-sm">
          Reference ID is missing.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              CIBIL Report
            </span>
            <h1 className="mt-1 text-3xl font-bold text-[#000080] tracking-tight sm:text-4xl">
              Report Sections
            </h1>
            <p className="mt-2 max-w-3xl break-all text-sm text-slate-600">
              Reference ID: <span className="font-semibold text-[#000080]">{referenceId}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#002366]" />
              ) : (
                <Download className="h-4 w-4 text-[#002366]" />
              )}
              Export
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartNew}
              className="rounded-xl bg-[#000080] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#000080]/80"
            >
              Start New CIBIL Flow
            </button>
          </div>
        </div>

        <CibilReportTabs referenceId={referenceId} />
      </div>
    </div>
  );
}