import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGstRefStatus } from "@/api/gst";
import { useNavigate } from "react-router-dom";

interface Step4Props {
  gstReferenceId: string;
  onRetry: () => void;
}

export default function Step4Processing({ gstReferenceId, onRetry }: Step4Props) {
  const navigate = useNavigate();
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 40;

  const { data, isError, error } = useQuery({
    queryKey: ["gstStatus", gstReferenceId],
    queryFn: async () => {
      setPollCount((prev) => prev + 1);
      return getGstRefStatus({ gst_ref_id: [gstReferenceId] });
    },
    // Poll every 15 seconds (15000ms), but stop if max polls reached or status is not INPROGRESS
    refetchInterval: (query) => {
      if (pollCount >= MAX_POLLS) return false;
      const statusList = query.state.data?.data?.gst_reference_id_status;
      const currentStatus = statusList?.[0]?.gst_reference_id_status;
      
      if (currentStatus === "COMPLETED" || currentStatus === "FAILED") {
        return false; // stop polling
      }
      return 15000;
    },
    refetchIntervalInBackground: true,
  });

  const statusList = data?.data?.gst_reference_id_status;
  const currentStatus = statusList?.[0]?.gst_reference_id_status;

  useEffect(() => {
    if (currentStatus === "COMPLETED") {
      // In a real app, this might navigate to a specific report page for this ID
      // navigate(`/gst/report/${gstReferenceId}`);
      setTimeout(() => {
        navigate("/gst/history");
      }, 2000);
    }
  }, [currentStatus, navigate]);

  const hasTimedOut = pollCount >= MAX_POLLS;
  const hasFailed = currentStatus === "FAILED" || isError;

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
      
      {currentStatus === "COMPLETED" ? (
        <div className="animate-in zoom-in duration-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
          <p className="text-gray-500">Your GST data has been successfully processed. Redirecting to results...</p>
        </div>
      ) : hasFailed ? (
        <div className="animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h2>
          <p className="text-gray-500 mb-6">
            {isError ? (error as any)?.message : "We encountered an error while analyzing your GST data."}
          </p>
          <button
            onClick={onRetry}
            className="bg-[#000080] text-white px-6 py-2 rounded-md hover:bg-[#000060] transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : hasTimedOut ? (
        <div className="animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Taking longer than expected</h2>
          <p className="text-gray-500 mb-6">
            The analysis is taking longer than usual. You can safely close this page and check your history later.
          </p>
          <button
            onClick={() => navigate("/gst/history")}
            className="bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Go to History
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#000080] border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-[#000080] font-semibold text-sm">
              {Math.min(100, Math.round((pollCount / 10) * 100))}%
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Data</h2>
          <p className="text-gray-500 mb-2">
            Please wait while we process your GST records.
            This may take a few minutes.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Reference ID: {gstReferenceId}
          </p>
        </div>
      )}
    </div>
  );
}
