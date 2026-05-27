import { useState, useEffect } from "react";
import Step1GstinEntry from "./Step1GstinEntry";
import Step2BusinessInfo from "./Step2BusinessInfo";
import Step3OtpValidation from "./Step3OtpValidation";
import Step4Processing from "./Step4Processing";

export default function GstWorkflow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [gstin, setGstin] = useState<string>("");
  const [gstReferenceId, setGstReferenceId] = useState<string>("");
  const [fromMonth, setFromMonth] = useState<string>("");
  const [toMonth, setToMonth] = useState<string>("");

  useEffect(() => {
    // Check if there's an ongoing processing session in localStorage
    const savedRefId = localStorage.getItem("gst_reference_id");
    if (savedRefId) {
      setGstReferenceId(savedRefId);
      setCurrentStep(4);
    }
  }, []);

  const handleStep1Next = (newGstin: string) => {
    setGstin(newGstin);
    setCurrentStep(2);
  };

  const handleStep2Success = (gstRefId: string) => {
    setGstReferenceId(gstRefId);
    localStorage.setItem("gst_reference_id", gstRefId);
    setCurrentStep(4);
  };

  const handleStep2RequiresAuth = (fMonth: string, tMonth: string) => {
    setFromMonth(fMonth);
    setToMonth(tMonth);
    setCurrentStep(3);
  };

  const handleStep3Next = (gstRefId: string) => {
    setGstReferenceId(gstRefId);
    localStorage.setItem("gst_reference_id", gstRefId);
    setCurrentStep(4);
  };

  const handleRetry = () => {
    localStorage.removeItem("gst_reference_id");
    setGstReferenceId("");
    setCurrentStep(1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      
      {/* Workflow Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`w-full h-1 ${
                    step === 1 ? "bg-transparent" : currentStep >= step ? "bg-[#000080]" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    currentStep === step
                      ? "border-[#000080] bg-[#000080] text-white shadow-md"
                      : currentStep > step
                      ? "border-[#000080] bg-[#000080] text-white"
                      : "border-gray-300 bg-white text-gray-500"
                  } font-semibold text-sm transition-colors duration-300`}
                >
                  {currentStep > step ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <div
                  className={`w-full h-1 ${
                    step === 4 ? "bg-transparent" : currentStep > step ? "bg-[#000080]" : "bg-gray-200"
                  }`}
                />
              </div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= step ? "text-[#000080]" : "text-gray-400"}`}>
                {step === 1 && "GSTIN"}
                {step === 2 && "Business & Date"}
                {step === 3 && "Authentication"}
                {step === 4 && "Analysis"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {currentStep === 1 && (
          <Step1GstinEntry onNext={handleStep1Next} />
        )}
        
        {currentStep === 2 && (
          <Step2BusinessInfo
            gstin={gstin}
            onSuccessSubmit={handleStep2Success}
            onRequiresAuth={handleStep2RequiresAuth}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3OtpValidation
            gstin={gstin}
            fromMonth={fromMonth}
            toMonth={toMonth}
            onNext={handleStep3Next}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Processing
            gstReferenceId={gstReferenceId}
            onRetry={handleRetry}
          />
        )}
      </div>

    </div>
  );
}
