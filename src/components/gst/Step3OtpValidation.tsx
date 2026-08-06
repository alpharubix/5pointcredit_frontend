import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { validateOtp, submitGst, generateOtp } from "@/api/gst";
import { toast } from "sonner";

interface Step3Props {
  gstin: string;
  fromMonth: string;
  toMonth: string;
  onNext: (gstReferenceId: string) => void;
  onBack: () => void;
}

export default function Step3OtpValidation({ gstin, fromMonth, toMonth, onNext, onBack }: Step3Props) {
  const [userName, setUserName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpReferenceId, setOtpReferenceId] = useState("");
  const [isValidated, setIsValidated] = useState(false);

  const otpMutation = useMutation({
    mutationFn: generateOtp,
    onSuccess: (res) => {
      toast.success("OTP sent successfully");
      setOtpReferenceId(res.data.otp_reference_id);
    },
  });

  const validateMutation = useMutation({
    mutationFn: validateOtp,
    onSuccess: () => {
      setIsValidated(true);
      toast.success("OTP Verified Successfully");
      // Auto-submit analysis
      submitMutation.mutate({ gstin, from_month: fromMonth, to_month: toMonth });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      if (msg === "OTP already authenticated") {
        setIsValidated(true);
        submitMutation.mutate({ gstin, from_month: fromMonth, to_month: toMonth });
      }
    }
  });

  const submitMutation = useMutation({
    mutationFn: submitGst,
    onSuccess: (res) => {
      onNext(res.data.gst_reference_id);
    },
  });

  const handleGenerateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Please enter your GST Portal username");
      return;
    }
    otpMutation.mutate({ gstin, user_name: userName });
  };

  const handleValidateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    validateMutation.mutate({ gstin, otp, otp_reference_id: otpReferenceId });
  };

  const handleResend = () => {
    otpMutation.mutate({ gstin, user_name: userName });
  };

  const handleManualSubmit = () => {
    submitMutation.mutate({ gstin, from_month: fromMonth, to_month: toMonth });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 mr-3" disabled={isValidated || submitMutation.isPending}>
          ← Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          {!otpReferenceId ? "GST Username" : isValidated ? "Start Analysis" : "Enter OTP"}
        </h2>
      </div>

      {!otpReferenceId ? (
        <form onSubmit={handleGenerateOtp} className="space-y-4">
          <p className="text-gray-500 text-sm mb-4">
            Please enter your username registered on the GST portal to trigger an OTP to your registered mobile number.
          </p>

          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              GST Portal Username
            </label>
            <input
              id="userName"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000080] focus:border-[#000080]"
              placeholder="e.g. your_username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={otpMutation.isPending}
            className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {otpMutation.isPending ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
            ) : null}
            {otpMutation.isPending ? "Generating OTP..." : "Generate OTP"}
          </button>
        </form>
      ) : !isValidated ? (
        <form onSubmit={handleValidateOtp} className="space-y-4">
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
            disabled={validateMutation.isPending || submitMutation.isPending}
            className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {(validateMutation.isPending || submitMutation.isPending) ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
            ) : null}
            {validateMutation.isPending ? "Verifying OTP..." : submitMutation.isPending ? "Starting Analysis..." : "Verify OTP"}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={otpMutation.isPending}
              className="text-sm text-[#000080] hover:underline disabled:text-gray-400"
            >
              {otpMutation.isPending ? "Resending..." : "Didn't receive code? Resend"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="bg-green-50 text-green-800 p-4 rounded-md text-sm mb-6 flex items-center border border-green-100">
            <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            OTP verified. Click below to trigger the analysis for the selected period ({fromMonth} to {toMonth}).
          </div>

          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={submitMutation.isPending}
            className="w-full bg-[#000080] hover:bg-[#000060] text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center shadow-md"
          >
            {submitMutation.isPending ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
            ) : null}
            {submitMutation.isPending ? "Submitting..." : "Start Analysis"}
          </button>
        </div>
      )}
    </div>
  );
}
