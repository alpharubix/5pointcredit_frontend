import type { AxiosRequestConfig } from 'axios';

import apiClient from '@/lib/axios';

export type CibilGender = 'M' | 'F' | 'T';
export type CibilWebhookStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export interface CibilApiResponse<T> {
  message: string;
  data: T | null;
  responseCode?: string;
  responsecode?: string;
}

export interface CibilResponse<T> {
  message: string;
  data: T;
  responseCode?: string;
}

export interface GenerateCibilOtpRequest {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  gender: CibilGender;
  mobile_number: string;
  address: string;
  state: string;
  pincode: string;
  identity: string;
}

export interface GenerateCibilOtpData {
  otp_flow_id: string;
}

export type GenerateCibilOtpResponse = CibilApiResponse<GenerateCibilOtpData>;

export interface VerifyCibilOtpRequest {
  otp_flow_id: string;
  otp: string;
}

export interface VerifyCibilOtpData {
  otp_flow_id: string;
}

export type VerifyCibilOtpResponse = CibilApiResponse<VerifyCibilOtpData>;

export interface ResendCibilOtpRequest {
  otp_flow_id: string;
}

export interface ResendCibilOtpData {
  otp_flow_id: string;
}

export type ResendCibilOtpResponse = CibilApiResponse<ResendCibilOtpData>;

export interface CibilReportListItem {
  reference_id: string;
  cibil_pulled_date: string;
}

export type ListCibilReportsResponse = CibilApiResponse<CibilReportListItem[]>;

export interface CibilWebhookStatusData {
  webhook_status: CibilWebhookStatus;
}

export type CibilWebhookStatusResponse = CibilApiResponse<CibilWebhookStatusData>;

export interface CibilRetailOverview {
  BureauAnalysis?: unknown;
  generalInfo?: unknown;
  [key: string]: unknown;
}

export interface CibilOverviewReport {
  EquifaxRetail?: CibilRetailOverview;
  [key: string]: unknown;
}

export interface CibilOverviewData {
  reference_id: string;
  cibil_pulled_date: string;
  cibil_report?: CibilOverviewReport;
}

export type CibilOverviewResponse = CibilApiResponse<CibilOverviewData>;

export interface CibilAccountSummaryRetail {
  accountSummary?: unknown;
  [key: string]: unknown;
}

export interface CibilAccountSummaryReport {
  EquifaxRetail?: CibilAccountSummaryRetail;
  [key: string]: unknown;
}

export interface CibilAccountSummaryData {
  reference_id: string;
  cibil_report?: CibilAccountSummaryReport;
}

export type CibilAccountSummaryResponse = CibilApiResponse<CibilAccountSummaryData>;

export interface CibilPaymentHistoryRetail {
  activeAccountRepaymentTrack?: unknown;
  closedAccountRepaymentTrack?: unknown;
  [key: string]: unknown;
}

export interface CibilPaymentHistoryReport {
  EquifaxRetail?: CibilPaymentHistoryRetail;
  [key: string]: unknown;
}

export interface CibilPaymentHistoryData {
  reference_id: string;
  cibil_report?: CibilPaymentHistoryReport;
}

export type CibilPaymentHistoryResponse = CibilApiResponse<CibilPaymentHistoryData>;

export interface CibilAnalysisRetail {
  ScoremeAnalysis?: unknown;
  [key: string]: unknown;
}

export interface CibilAnalysisReport {
  EquifaxRetail?: CibilAnalysisRetail;
  [key: string]: unknown;
}

export interface CibilAnalysisData {
  reference_id: string;
  cibil_report?: CibilAnalysisReport;
}

export type CibilAnalysisResponse = CibilApiResponse<CibilAnalysisData>;

type RequestOptions = Pick<AxiosRequestConfig, 'signal'>;

const getResponseCode = <T>(response: CibilApiResponse<T>) =>
  response.responseCode || response.responsecode;

const requireResponseData = <T>(
  response: CibilApiResponse<T>,
  fallbackMessage: string
) => {
  if (response.data === null || response.data === undefined) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
};

const normalizeResponse = <T>(
  response: CibilApiResponse<T>,
  fallbackMessage: string
): CibilResponse<T> => ({
  message: response.message,
  data: requireResponseData(response, fallbackMessage),
  responseCode: getResponseCode(response),
});

export async function generateCibilOtp(
  payload: GenerateCibilOtpRequest,
  options?: RequestOptions
) {
  const response = await apiClient.post<GenerateCibilOtpResponse>(
    '/cibil/generate-otp',
    payload,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'OTP flow ID was not returned.');
}

export async function validateCibilOtp(
  payload: VerifyCibilOtpRequest,
  options?: RequestOptions
) {
  const response = await apiClient.post<VerifyCibilOtpResponse>(
    '/cibil/validate-otp',
    payload,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to verify OTP.');
}

export async function resendCibilOtp(
  payload: ResendCibilOtpRequest,
  options?: RequestOptions
) {
  const response = await apiClient.post<ResendCibilOtpResponse>(
    '/cibil/resend-otp',
    payload,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to resend OTP.');
}

export async function listCibilReports(options?: RequestOptions) {
  const response = await apiClient.get<ListCibilReportsResponse>(
    '/cibil/list-reports',
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to fetch CIBIL reports.');
}

export async function getCibilOverview(
  referenceId: string,
  options?: RequestOptions
) {
  const response = await apiClient.get<CibilOverviewResponse>(
    `/cibil/overview/${encodeURIComponent(referenceId)}`,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to fetch report.');
}

export async function getCibilAccountSummary(
  referenceId: string,
  options?: RequestOptions
) {
  const response = await apiClient.get<CibilAccountSummaryResponse>(
    `/cibil/account-summary/${encodeURIComponent(referenceId)}`,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to fetch account summary.');
}

export async function getCibilPaymentHistory(
  referenceId: string,
  options?: RequestOptions
) {
  const response = await apiClient.get<CibilPaymentHistoryResponse>(
    `/cibil/payment-history/${encodeURIComponent(referenceId)}`,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to fetch payment history.');
}

export async function getCibilAnalysis(
  referenceId: string,
  options?: RequestOptions
) {
  const response = await apiClient.get<CibilAnalysisResponse>(
    `/cibil/analysis/${encodeURIComponent(referenceId)}`,
    { signal: options?.signal }
  );

  return normalizeResponse(response.data, 'Unable to fetch analysis.');
}

export async function getCibilWebhookStatus(
  otpFlowId: string,
  options?: RequestOptions
) {
  const response = await apiClient.get<CibilWebhookStatusResponse>(
    `/cibil/webhook-status/${encodeURIComponent(otpFlowId)}`,
    { signal: options?.signal }
  );

  return normalizeResponse(
    response.data,
    'Unable to fetch CIBIL report status.'
  );
}