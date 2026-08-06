import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchBasicInfo, submitGst, updateGstin, getGstin, addNewGstin } from "@/api/gst";
import { toast } from "sonner";

interface Step2Props {
  gstin: string;
  onSuccessSubmit: (gstReferenceId: string) => void;
  onRequiresAuth: (fromMonth: string, toMonth: string) => void;
  onBack: () => void;
  onGstinChange: (newGstin: string) => void;
}

export default function Step2BusinessInfo({ gstin, onSuccessSubmit, onRequiresAuth, onGstinChange }: Step2Props) {
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGstin, setNewGstin] = useState("");

  // Fetch list of GSTINs from the backend
  const { data: gstinData } = useQuery({
    queryKey: ["gstin"],
    queryFn: getGstin,
  });

  // Manage multiple GSTINs
  const [gstinList, setGstinList] = useState<string[]>(() => {
    const saved = localStorage.getItem("gstin_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (gstin && !parsed.includes(gstin)) {
            return [...parsed, gstin];
          }
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return gstin ? [gstin] : [];
  });

  const [activeGstin, setActiveGstin] = useState<string>(gstin);
  const [businessDataMap, setBusinessDataMap] = useState<Record<string, any>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem("gstin_list", JSON.stringify(gstinList));
  }, [gstinList]);

  const fetchInfoForGstin = async (gstinCode: string) => {
    if (!gstinCode || businessDataMap[gstinCode] || loadingMap[gstinCode]) return;

    setLoadingMap(prev => ({ ...prev, [gstinCode]: true }));
    try {
      const res = await fetchBasicInfo({ gstin: gstinCode });
      const data = res?.data?.[0];
      if (data) {
        setBusinessDataMap(prev => ({ ...prev, [gstinCode]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch info for", gstinCode);
      toast.error(`Failed to fetch details for GSTIN: ${gstinCode}`);
    } finally {
      setLoadingMap(prev => ({ ...prev, [gstinCode]: false }));
    }
  };

  // Synchronize list with backend response
  useEffect(() => {
    if (gstinData?.is_found && gstinData.gst_number) {
      const list = Array.isArray(gstinData.gst_number)
        ? gstinData.gst_number
        : typeof gstinData.gst_number === "string"
        ? gstinData.gst_number.split(",").map((g: string) => g.trim()).filter(Boolean)
        : [];
      
      const mergedList = [...list];
      if (gstin && !mergedList.includes(gstin)) {
        mergedList.push(gstin);
      }
      setGstinList(mergedList);
    } else if (gstin) {
      setGstinList((prev) => prev.includes(gstin) ? prev : [...prev, gstin]);
    }
  }, [gstinData, gstin]);

  // Set active GSTIN
  useEffect(() => {
    if (gstin) {
      setActiveGstin(gstin);
    }
  }, [gstin]);

  // Fetch info for all loaded GSTINs
  useEffect(() => {
    gstinList.forEach((item) => {
      fetchInfoForGstin(item);
    });
  }, [gstinList]);

  const addNewGstinMutation = useMutation({
    mutationFn: addNewGstin,
    onSuccess: (res) => {
      const updatedGstin = res.data.gstin;
      toast.success("GSTIN added successfully.");
      setIsModalOpen(false);
      
      if (!gstinList.includes(updatedGstin)) {
        setGstinList(prev => [...prev, updatedGstin]);
      }
      setActiveGstin(updatedGstin);
      onGstinChange(updatedGstin);
      fetchInfoForGstin(updatedGstin);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to add GSTIN";
      toast.error(msg);
    }
  });

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gstinToSave = newGstin.toUpperCase().trim();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gstinToSave.length !== 15) {
      toast.error("GSTIN must be exactly 15 characters long");
      return;
    }

    if (!gstRegex.test(gstinToSave)) {
      toast.error("Invalid GSTIN format");
      return;
    }

    addNewGstinMutation.mutate({ gstin: gstinToSave });
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // basic mmYYYY regex
    const dateRegex = /^(0[1-9]|1[0-2])\d{4}$/;
    if (!dateRegex.test(fromMonth) || !dateRegex.test(toMonth)) {
      toast.error("Date must be in MMYYYY format (e.g. 012024)");
      return;
    }

    submitMutation.mutate({ gstin: activeGstin, from_month: fromMonth, to_month: toMonth });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Business Details</h2>
        <button
          type="button"
          onClick={() => {
            setNewGstin("");
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#000080] hover:bg-[#000060] rounded-md transition-colors shadow-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Add new
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {gstinList.map((itemGstin) => {
          const isSelected = itemGstin === activeGstin;
          const data = businessDataMap[itemGstin];
          const isLoading = loadingMap[itemGstin];

          return (
            <div
              key={itemGstin}
              className={`border-2 rounded-xl transition-all overflow-hidden ${
                isSelected 
                  ? "border-[#000080] shadow-sm bg-white" 
                  : "border-slate-100 hover:border-slate-300 bg-slate-50/20 cursor-pointer"
              }`}
              onClick={() => {
                if (!isSelected) {
                  setActiveGstin(itemGstin);
                  onGstinChange(itemGstin);
                  fetchInfoForGstin(itemGstin);
                }
              }}
            >
              {/* Card Header / Summary */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Selector Circle Indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected 
                      ? "border-[#000080] bg-[#000080]" 
                      : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 tracking-wide uppercase">{itemGstin}</span>
                      {isLoading && (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-[#000080] animate-spin" />
                      )}
                    </div>
                    {data && (
                      <span className="text-xs text-slate-500 font-medium">{data.tradeName || data.legalNameOfBusiness}</span>
                    )}
                  </div>
                </div>

                {data && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    data.gstinStatus.toLowerCase() === 'active' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {data.gstinStatus}
                  </span>
                )}
              </div>

              {/* Expanded details (only for selected card) */}
              {isSelected && (
                <div className="border-t border-slate-100 p-6 bg-white space-y-6">
                  {data ? (
                    <>
                      {/* Business Grid Card Details */}
                      <div className="bg-slate-50/60 p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Legal Name</span>
                          <strong className="text-[14px] font-bold text-slate-900">{data.legalNameOfBusiness}</strong>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Trade Name</span>
                          <strong className="text-[14px] font-bold text-slate-900">{data.tradeName}</strong>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Status</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
                              data.gstinStatus.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {data.gstinStatus}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Taxpayer Type</span>
                          <strong className="text-[14px] font-bold text-slate-900">{data.taxpayerType}</strong>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Date of Registration</span>
                          <strong className="text-[14px] font-bold text-slate-900">{data.dateOfRegistration}</strong>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-400 mb-1">Constitution of Business</span>
                          <strong className="text-[14px] font-bold text-slate-900">{data.constitutionOfBusiness}</strong>
                        </div>
                      </div>

                      {/* Select Duration Form */}
                      {data.gstinStatus.toLowerCase() !== 'active' ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                          <p className="text-sm text-red-700">
                            Your GSTIN status is not Active. You cannot proceed further.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6">
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">Select Duration</h3>
                          <p className="text-slate-400 text-sm mb-6">
                            Specify the period you would like to run the analysis for.
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <label htmlFor="fromMonth" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                From Month
                              </label>
                              <input
                                id="fromMonth"
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-slate-800 placeholder-slate-300"
                                placeholder="MMYYYY"
                                value={fromMonth}
                                onChange={(e) => setFromMonth(e.target.value)}
                                required
                                maxLength={6}
                              />
                            </div>
                            <div>
                              <label htmlFor="toMonth" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                To Month
                              </label>
                              <input
                                id="toMonth"
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-slate-800 placeholder-slate-300"
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
                              className="bg-[#000080] hover:bg-[#000060] text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm"
                            >
                              {submitMutation.isPending ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
                              ) : null}
                              {submitMutation.isPending ? "Starting Analysis..." : "Start Analysis"}
                            </button>
                          )}
                        </form>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-center py-4">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-[#000080] animate-spin" />
                          <span>Fetching business details...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No details loaded. Click card to retry.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New GSTIN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New GSTIN</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the new Goods and Services Tax Identification Number (GSTIN) you would like to analyze.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label htmlFor="newGstin" className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN Number
                </label>
                <input
                  id="newGstin"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080] uppercase"
                  placeholder="e.g. 27AAAPL1234C1Z5"
                  value={newGstin}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 15);
                    setNewGstin(clean);
                  }}
                  required
                  maxLength={15}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={addNewGstinMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addNewGstinMutation.isPending}
                  className="bg-[#000080] hover:bg-[#000060] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {addNewGstinMutation.isPending ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
                  ) : null}
                  {addNewGstinMutation.isPending ? "Saving..." : "Save GSTIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
