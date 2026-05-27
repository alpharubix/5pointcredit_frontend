import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchBasicInfo, submitGst } from "@/api/gst";
import { toast } from "sonner";

interface Step2Props {
  gstin: string;
  onSuccessSubmit: (gstReferenceId: string) => void;
  onRequiresAuth: (fromMonth: string, toMonth: string) => void;
  onBack: () => void;
}

export default function Step2BusinessInfo({ gstin, onSuccessSubmit, onRequiresAuth }: Step2Props) {
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);

  const infoMutation = useMutation({
    mutationFn: fetchBasicInfo,
    onError: () => {
      toast.error("Failed to fetch business details for this GSTIN");
    }
  });

  const submitMutation = useMutation({
    mutationFn: submitGst,
    onSuccess: (res) => {
      toast.success("Analysis started successfully!");
      onSuccessSubmit(res.data.gst_reference_id);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const responseCode = detail?.responseCode;
      const message = detail?.message || error.response?.data?.message || "Failed to start analysis";

      if (responseCode === "EOA048" || responseCode === "EAE052") {
        setNeedsAuth(true);
        toast.error("GST Portal authentication required.");
      } else {
        toast.error(message);
      }
    }
  });

  useEffect(() => {
    if (gstin) {
      infoMutation.mutate({ gstin });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // basic mmYYYY regex
    const dateRegex = /^(0[1-9]|1[0-2])\d{4}$/;
    if (!dateRegex.test(fromMonth) || !dateRegex.test(toMonth)) {
      toast.error("Date must be in MMYYYY format (e.g. 012024)");
      return;
    }

    submitMutation.mutate({ gstin, from_month: fromMonth, to_month: toMonth });
  };

  const businessData = infoMutation.data?.data;

  if (infoMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
        <span className="h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin mb-4" />
        <p className="text-gray-600 font-medium animate-pulse">Fetching business details (this may take a few seconds)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Business Details</h2>
      </div>

      {businessData ? (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Legal Name</span>
              <strong className="text-gray-900">{businessData.legalNameOfBusiness}</strong>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Trade Name</span>
              <strong className="text-gray-900">{businessData.tradeName}</strong>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${businessData.gstinStatus.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {businessData.gstinStatus}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Taxpayer Type</span>
              <strong className="text-gray-900">{businessData.taxpayerType}</strong>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Date of Registration</span>
              <strong className="text-gray-900">{businessData.dateOfRegistration}</strong>
            </div>
          </div>

          {businessData.gstinStatus.toLowerCase() !== 'active' ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Your GSTIN status is not Active. You cannot proceed further.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Duration</h3>
              <p className="text-gray-500 text-sm mb-4">
                Specify the period you would like to run the analysis for.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="fromMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    From Month
                  </label>
                  <input
                    id="fromMonth"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080]"
                    placeholder="MMYYYY"
                    value={fromMonth}
                    onChange={(e) => setFromMonth(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="toMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    To Month
                  </label>
                  <input
                    id="toMonth"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080]"
                    placeholder="MMYYYY"
                    value={toMonth}
                    onChange={(e) => setToMonth(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              {needsAuth ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
                    <p className="text-sm text-amber-700 font-medium">
                      Authentication required. Please complete the OTP verification with the GST Portal to proceed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequiresAuth(fromMonth, toMonth)}
                    className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-3 px-6 rounded-md transition-colors flex justify-center items-center shadow-sm"
                  >
                    Authenticate with OTP
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm"
                >
                  {submitMutation.isPending ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
                  ) : null}
                  {submitMutation.isPending ? "Starting Analysis..." : "Start Analysis"}
                </button>
              )}
            </form>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-red-500">
          Failed to load business details. Please try again.
        </div>
      )}
    </div>
  );
}
