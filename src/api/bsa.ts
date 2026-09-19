import apiClient from '@/lib/axios';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BankAccounts {
  entityName?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  accountType?: string | null;
  account_type?: string | null;
  bankCode?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  bankName?: string | null;
  [key: string]: any;
}

export type BankAccount = BankAccounts;

export interface BsaBankAccount {
  account_id?: string | number | null;
  user_id?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  created_at?: string | null;
  account_number?: string | null;
  account_type?: string | null;
}

export interface DateRange {
  from_date?: string | null;
  to_date?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  [key: string]: any;
}

export interface DateRangeResponse {
  message?: string;
  data: DateRange;
}

export interface BankAccountsResponse {
  message?: string;
  data: BankAccounts[];
}

export interface BsaBankAccountsResponse {
  message: string;
  data: BsaBankAccount[];
}

export interface Bank {
  code: string;
  bankName: string;
  [key: string]: any;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch bank accounts list for a customer.
 */
export async function getBankAccounts(custId?: string): Promise<BankAccounts[]> {
  const response = await apiClient.get<BankAccountsResponse>(
    '/bsa/bank-accounts',
    {
      params: custId ? { cust_id: custId } : undefined,
      errorMessage: 'Failed to fetch the bank Accounts. Please Try again!',
    }
  );

  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.accounts)
    ? (raw as any).accounts
    : Array.isArray((raw as any)?.bank_accounts)
    ? (raw as any).bank_accounts
    : Array.isArray((raw as any)?.bankAccounts)
    ? (raw as any).bankAccounts
    : [];

  // Normalize camelCase and snake_case properties
  return list.map((acc: any) => ({
    ...acc,
    accountNumber: acc.accountNumber ?? acc.account_number ?? acc.accountNo ?? '',
    account_number: acc.account_number ?? acc.accountNumber ?? '',
    bankCode: acc.bankCode ?? acc.bank_code ?? '',
    bank_code: acc.bank_code ?? acc.bankCode ?? '',
    accountType: acc.accountType ?? acc.account_type ?? '',
    account_type: acc.account_type ?? acc.accountType ?? '',
    bank_name: acc.bank_name ?? acc.bankName ?? '',
    bankName: acc.bankName ?? acc.bank_name ?? '',
    entityType: acc.entityType ?? acc.entity_type ?? '',
    entity_type: acc.entity_type ?? acc.entityType ?? '',
  }));
}

/**
 * Fetch BSA date range for a specific account.
 */
export async function getDateRange(accountNumber?: string): Promise<DateRange> {
  if (!accountNumber) return {};

  try {
    const response = await apiClient.post<DateRangeResponse>(
      '/bsa/report-date-range',
      { account_number: accountNumber },
      { errorMessage: 'Failed to fetch the date range. Please Try again!' }
    );
    return response.data?.data ?? response.data ?? {};
  } catch (error: any) {
    if (error?.response?.status === 405 || error?.response?.status === 404) {
      const getResponse = await apiClient.get<DateRangeResponse>(
        '/bsa/report-date-range',
        {
          params: { account_number: accountNumber },
        }
      );
      return getResponse.data?.data ?? getResponse.data ?? {};
    }
    throw error;
  }
}

/**
 * Fetch bank account details.
 */
export async function getBankAccountDetails(accountNumber: string) {
  const response = await apiClient.post('/bsa/account-details', {
    account_number: accountNumber,
  });
  return response.data?.data?.account_details ?? response.data?.data ?? response.data;
}

/**
 * Fetch CRM bank accounts filter.
 */
export async function getBsaBankAccounts(): Promise<BsaBankAccount[]> {
  const response = await apiClient.get<BsaBankAccountsResponse>(
    '/crm/accounts-filter',
    {
      params: { module: 'bsa' },
      errorMessage: 'Failed to fetch bank accounts. Please try again.',
    }
  );

  return Array.isArray(response.data?.data) ? response.data.data : [];
}

/**
 * Fetch supported bank names/codes.
 */
export async function getBankNames(): Promise<Bank[]> {
  const response = await apiClient.get('/bsa/get-bank-names');
  return response.data?.data ?? response.data;
}

export interface BsaUploadPayload {
  entityName: string;
  entityType: string;
  accountNumber: string;
  accountType: string;
  bankCode: string;
  password?: string;
  filePassword?: string;
  files: File[];
  custId?: string;
}

/**
 * Upload bank statement files for BSA analysis.
 */
export async function uploadBsaStatement(payload: BsaUploadPayload) {
  const formPayload = new FormData();
  const jsonString = JSON.stringify({
    entityName: payload.entityName,
    entityType: payload.entityType,
    accountNumber: payload.accountNumber,
    accountType: payload.accountType,
    bankCode: payload.bankCode,
    filePassword: payload.filePassword || payload.password,
  });

  formPayload.append('data', jsonString);
  payload.files.forEach((file) => {
    formPayload.append('files', file);
  });

  const config = payload.custId ? { params: { cust_id: payload.custId } } : {};

  const response = await apiClient.post('/bsa/upload', formPayload, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipErrorToast: true,
    ...config,
  });

  return response.data;
}

/**
 * Confirm uploaded bank statement reference ID.
 */
export async function confirmBsaUpload(upload_ref_id: string) {
  const response = await apiClient.post(
    '/bsa/upload_ref_id',
    { upload_ref_id },
    { skipErrorToast: true }
  );
  return response.data;
}

