import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGstin, updateGstin } from "@/api/gst";
import { toast } from "sonner";

interface Step1Props {
  onNext: (gstin: string) => void;
}

export default function Step1GstinEntry({ onNext }: Step1Props) {
  const [gstinInput, setGstinInput] = useState("");
  const queryClient = useQueryClient();

  const { data: gstinData, isLoading: isLoadingGstin } = useQuery({
    queryKey: ["gstin"],
    queryFn: getGstin,
  });

  useEffect(() => {
    if (gstinData?.is_found && gstinData.gst_number) {
      const rawGst = gstinData.gst_number;
      const gstinVal = Array.isArray(rawGst)
        ? rawGst[0]
        : typeof rawGst === "string"
        ? rawGst.split(",")[0]
        : "";

      const cleanGstin = gstinVal?.trim() || "";
      if (cleanGstin) {
        setGstinInput(cleanGstin);
        onNext(cleanGstin);
      }
    }
  }, [gstinData, onNext]);

  const updateMutation = useMutation({
    mutationFn: updateGstin,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["gstin"] });
      const resolved = (res.data?.gstin || (res as any).gstin || res.data || "").toUpperCase().trim();
      onNext(resolved);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gstin = gstinInput.toUpperCase().trim();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (gstin.length !== 15) {
      toast.error("GSTIN must be exactly 15 characters long");
      return;
    }

    if (!gstRegex.test(gstin)) {
      toast.error("Invalid GSTIN format");
      return;
    }

    updateMutation.mutate({ gstin });
  };

  if (isLoadingGstin) {
    return (
      <div className="flex justify-center p-8">
        <span className="h-8 w-8 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Enter GSTIN</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Please provide your Goods and Services Tax Identification Number (GSTIN) to proceed.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">
            GSTIN Number
          </label>
          <input
            id="gstin"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080] uppercase"
            placeholder="e.g. 27AAAPL1234C1Z5"
            value={gstinInput}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 15);
              setGstinInput(clean);
            }}
            required
            maxLength={15}
          />
        </div>
        
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {updateMutation.isPending ? (
            <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
          ) : null}
          {updateMutation.isPending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
