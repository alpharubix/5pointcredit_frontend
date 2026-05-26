import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { validateOtp, submitGst, generateOtp } from "@/api/gst";
import { toast } from "sonner";

interface Step3Props {
  gstin: string;
  otpReferenceId: string;
  userName: string;
  onNext: (gstReferenceId: string) => void;
  onBack: () => void;
  onUpdateOtpRef: (newRefId: string) => void;
}

export default function Step3OtpValidation({ gstin, otpReferenceId, userName, onNext, onBack, onUpdateOtpRef }: Step3Props) {
  const [otp, setOtp] = useState("");
  const [isValidated, setIsValidated] = useState(false);

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  const resendMutation = useMutation({
    mutationFn: generateOtp,
    onSuccess: (res) => {
      toast.success("OTP resent successfully");
      onUpdateOtpRef(res.data.otp_reference_id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  });

  const validateMutation = useMutation({
    mutationFn: validateOtp,
    onSuccess: () => {
      setIsValidated(true);
      toast.success("OTP Verified Successfully");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      if (msg === "OTP has expired" || msg === "Invalid otp_reference_id") {
        toast.error("OTP expired or invalid. Please resend.");
      } else if (msg === "OTP already authenticated") {
        setIsValidated(true);
      } else {
        toast.error(msg || "Invalid OTP");
      }
    }
  });

  const submitMutation = useMutation({
    mutationFn: submitGst,
    onSuccess: (res) => {
      onNext(res.data.gst_reference_id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit for analysis");
    }
  });

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    validateMutation.mutate({ gstin, otp, otp_reference_id: otpReferenceId });
  };

  const handleResend = () => {
    resendMutation.mutate({ gstin, user_name: userName });
  };

  const handleSubmitAnalysis = (e: React.FormEvent) => {
    e.preventDefault();

    // basic mmYYYY regex
    const dateRegex = /^(0[1-9]|1[0-2])\d{4}$/;
    if (!dateRegex.test(fromMonth) || !dateRegex.test(toMonth)) {
      toast.error("Date must be in MMYYYY format (e.g. 012024)");
      return;
    }

    submitMutation.mutate({
      gstin,
      from_month: fromMonth,
      to_month: toMonth
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 mr-3" disabled={isValidated}>
          ← Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          {isValidated ? "Select Duration" : "Enter OTP"}
        </h2>
      </div>

      {!isValidated ? (
        <form onSubmit={handleValidate} className="space-y-4">
          <p className="text-gray-500 text-sm mb-4">
            An OTP has been sent to your registered mobile number for GSTIN <span className="font-semibold text-gray-700">{gstin}</span>.
          </p>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              One-Time Password (OTP)
            </label>
            <input
              id="otp"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080] text-center tracking-widest text-lg"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={validateMutation.isPending}
            className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {validateMutation.isPending ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
            ) : null}
            {validateMutation.isPending ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="text-sm text-[#000080] hover:underline disabled:text-gray-400"
            >
              {resendMutation.isPending ? "Resending..." : "Didn't receive code? Resend"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmitAnalysis} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm mb-6 flex items-center border border-green-100">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Authentication successful! Now select the period for analysis.
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full mt-6 bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center shadow-md"
          >
            {submitMutation.isPending ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
            ) : null}
            {submitMutation.isPending ? "Submitting..." : "Start Analysis"}
          </button>
        </form>
      )}
    </div>
  );
}
