import apiClient from "@/lib/axios";

export interface AadhaarOtpResponse {
  aadhaar_number: string;
  reference_id: string;
}

export interface AadhaarDetails {
  [key: string]: any;
}

export interface DigiLockerSessionResponse {
  kyc_flow_id: string;
  digilocker_url?: string;
  kyc_url?: string;
  session_status?: string;
}

export interface DigiLockerDocument {
  documentType: string;
  documentFormat: string;
  documentUri: string;
  documentUrl?: string;
}

export interface DigiLockerPrecheckResponse {
  user_id: string;
  document_list: DigiLockerDocument[];
  kyc_flow_id?: string;
  session_id?: string;
}

export interface DigiLockerDocumentUrlResponse {
  documentUrl: string;
}

// 1. Generate Aadhaar OTP
export const generateAadhaarOtp = async (aadhaar_number: string): Promise<AadhaarOtpResponse> => {
  const response = await apiClient.post("/kyc/aadhaar/generate-otp", {
    aadhaar_number,
  });
  return response.data?.data;
};

// 2. Validate Aadhaar OTP
export const validateAadhaarOtp = async (
  aadhaar_number: string,
  otp: string,
  reference_id: string
): Promise<any> => {
  const response = await apiClient.post("/kyc/aadhaar/validate-otp", {
    aadhaar_number,
    otp,
    reference_id,
  });
  return response.data?.data;
};

// 3. Fetch Aadhaar Details
export const  fetchAadhaarDetails = async (): Promise<AadhaarDetails> => {
  const response = await apiClient.get("/kyc/aadhaar/details");
  return response.data?.data;
};

// 4. Generate DigiLocker URL
export const generateDigiLockerUrl = async (): Promise<DigiLockerSessionResponse> => {
  const response = await apiClient.get("/kyc/digilocker/generate-url");
  return response.data?.data;
};

// 5. Check DigiLocker Session Status
export const checkSessionStatus = async (kyc_flow_id: string): Promise<DigiLockerSessionResponse> => {
  const response = await apiClient.post("/kyc/digilocker/session-status", {
    kyc_flow_id,
  });
  return response.data?.data;
};

// 6. List DigiLocker Documents
export const listDocuments = async (kyc_flow_id: string): Promise<{ document_list: DigiLockerDocument[], kyc_flow_id: string }> => {
  const response = await apiClient.post("/kyc/digilocker/list-documents", {
    kyc_flow_id,
  });
  return response.data?.data;
};

// 7. Fetch DigiLocker Document URL
export const getDocumentUrl = async (
  kyc_flow_id: string,
  document_format: string,
  document_uri: string,
  document_type: string
): Promise<DigiLockerDocumentUrlResponse> => {
  const response = await apiClient.post("/kyc/digilocker/document-url", {
    kyc_flow_id,
    document_format,
    document_uri,
    document_type,
  });
  return response.data?.data;
};

// 8. DigiLocker Document Precheck
export const documentPrecheck = async (): Promise<DigiLockerPrecheckResponse> => {
  const response = await apiClient.get("/kyc/digilocker/document-precheck");
  return response.data?.data;
};

// 9. Get Current DigiLocker Session
export const getCurrentSession = async (): Promise<{ kyc_flow_id: string }> => {
  const response = await apiClient.get("/kyc/digilocker/current-status");
  return response.data?.data;
};
