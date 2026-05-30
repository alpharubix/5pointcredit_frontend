import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GstinResponse {
  is_found: boolean;
  gst_number: string | null;
}

export interface SaveGstinPayload {
  gstin: string;
}

export interface SaveGstinResponse {
  message: string;
  data: {
    gstin: string;
  };
}

export interface BasicInfoPayload {
  gstin: string;
}

export interface BasicInfoResponse {
  data: {
    gstin: string;
    legalNameOfBusiness: string;
    tradeName: string;
    gstinStatus: string;
    taxpayerType: string;
    constitutionOfBusiness: string;
    natureOfBusiness: string[];
    dateOfRegistration: string;
  };
}

export interface GenerateOtpPayload {
  gstin: string;
  user_name: string;
}

export interface GenerateOtpResponse {
  data: {
    gstin: string;
    otp_reference_id: string;
  };
}

export interface ValidateOtpPayload {
  gstin: string;
  otp: string;
  otp_reference_id: string;
}

export interface ValidateOtpResponse {
  data: {
    gstin: string;
    is_otp_validated: boolean;
  };
}

export interface SubmitGstPayload {
  gstin: string;
  from_month: string;
  to_month: string;
}

export interface SubmitGstResponse {
  data: {
    gstin: string;
    gst_reference_id: string;
  };
}

export interface GstStatusPayload {
  gst_ref_id: string[];
}

export interface GstStatusItem {
  gst_reference_id: string;
  gst_reference_id_status: "INPROGRESS" | "COMPLETED" | "FAILED";
}

export interface GstStatusResponse {
  data: {
    gst_reference_id_status: GstStatusItem[];
  };
}

export interface GstHistoryItem {
  reference_id: string;
  gst_reference_id_status: string;
  from_month: string;
  to_month: string;
}

export interface GstHistoryResponse {
  data: GstHistoryItem[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const getGstin = async (): Promise<GstinResponse> => {
  const response = await apiClient.get("/gst/gstin", {
    errorMessage: "Failed to fetch GSTIN. Please try again.",
  });
  return response.data;
};

export const updateGstin = async (data: SaveGstinPayload): Promise<SaveGstinResponse> => {
  const response = await apiClient.patch("/gst/gstin", data, {
    successMessage: "GSTIN updated successfully.",
    errorMessage: "Failed to update GSTIN. Please try again.",
  });
  return response.data;
};

export const fetchBasicInfo = async (data: BasicInfoPayload): Promise<BasicInfoResponse> => {
  const response = await apiClient.post("/gst/gstin-basic-info", data, {
    errorMessage: "Could not fetch GST basic info. Please verify your GSTIN.",
  });
  return response.data;
};

export const generateOtp = async (data: GenerateOtpPayload): Promise<GenerateOtpResponse> => {
  const response = await apiClient.post("/gst/generate-otp", data, {
    successMessage: "OTP sent to your registered mobile number.",
    errorMessage: "Failed to generate OTP. Please try again.",
  });
  return response.data;
};

export const validateOtp = async (data: ValidateOtpPayload): Promise<ValidateOtpResponse> => {
  const response = await apiClient.post("/gst/validate-otp", data, {
    successMessage: "OTP verified successfully.",
    errorMessage: "Invalid or expired OTP. Please try again.",
  });
  return response.data;
};

export const submitGst = async (data: SubmitGstPayload): Promise<SubmitGstResponse> => {
  const response = await apiClient.post("/gst/post-gstin", data, {
    successMessage: "GST data submitted successfully.",
    errorMessage: "GST submission failed. Please try again.",
  });
  return response.data;
};

export const getGstRefStatus = async (data: GstStatusPayload): Promise<GstStatusResponse> => {
  const response = await apiClient.post("/gst/get-gst-ref-status", data, {
    errorMessage: "Failed to fetch GST status. Please try again.",
  });
  return response.data;
};

export const getGstHistory = async (): Promise<GstHistoryResponse> => {
  const response = await apiClient.get("/gst/users-ref-ids");
  return response.data;
};

// ─── GST Reports APIs ────────────────────────────────────────────────────────

export interface GstReportPayload {
  gst_reference_id: string;
}

export interface GstOverviewResponse {
  message: string;
  data: any[];
}

export interface GstTopSuppliersCustomersResponse {
  message: string;
  data: any[];
}

export interface GstMonthlySummaryResponse {
  message: string;
  data: any;
}

export const getGstOverview = async (data: GstReportPayload): Promise<GstOverviewResponse> => {
  const response = await apiClient.post("/gst/overview", data, {
    errorMessage: "Failed to fetch GST Overview. Please try again.",
  });
  return response.data;
};

export const getGstTopSuppliersCustomers = async (data: GstReportPayload): Promise<GstTopSuppliersCustomersResponse> => {
  const response = await apiClient.post("/gst/top-suppliers-and-customers", data, {
    errorMessage: "Failed to fetch Top Suppliers and Customers. Please try again.",
  });
  return response.data;
};

export const getGstMonthlySummary = async (data: GstReportPayload): Promise<GstMonthlySummaryResponse> => {
  const response = await apiClient.post("/gst/monthly-sales-purchase-summary", data, {
    errorMessage: "Failed to fetch Monthly Sales and Purchase Summary. Please try again.",
  });
  return response.data;
};
