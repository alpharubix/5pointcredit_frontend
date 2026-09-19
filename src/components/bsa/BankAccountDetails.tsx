import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Loader2 } from 'lucide-react';

export interface BankAccountDetailsData {
  bank_name?: string;
  company_name?: string;
  account_number?: string;
  period?: string;
  no_of_months?: string | number;
  account_type?: string;
  cc_od_limit?: string | number;
  currency?: string;
  opening_balance?: string | number;
  closing_balance?: string | number;
  [key: string]: any;
}

export interface BankAccountDetailsProps {
  accountDetails?: BankAccountDetailsData | any;
  accountNumber?: string;
}

export function BankAccountDetails({ accountDetails: propDetails, accountNumber: propAccNum }: BankAccountDetailsProps) {
  const selectedAccNum =
    propAccNum ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('selected_bsa_account_number') ||
        new URLSearchParams(window.location.search).get('accountNumber') ||
        ''
      : '');

  const { data: fetchedDetails, isLoading } = useQuery({
    queryKey: ['account-details-component', selectedAccNum],
    queryFn: async () => {
      if (!selectedAccNum) return null;
      const res = await apiClient.post('/bsa/account-details', {
        account_number: selectedAccNum,
      });
      return res.data?.data?.account_details ?? res.data?.data ?? res.data;
    },
    enabled: !propDetails && !!selectedAccNum,
  });

  const accountDetails = propDetails || fetchedDetails;

  if (isLoading && !accountDetails) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-[#000080]" />
        <span className="text-sm font-medium">Loading Account Details...</span>
      </div>
    );
  }

  if (!accountDetails) return null;

  // If accountDetails is wrapped in backend message (object, string, or array)
  let raw: any = accountDetails;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      // not JSON string
    }
  }
  if (raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'object') {
    raw = raw.message;
  }
  if (Array.isArray(raw)) {
    raw = raw[0] || {};
  }

  const details = {
    bank_name:
      raw?.bank_name ??
      raw?.bankName ??
      raw?.['Bank Name'] ??
      raw?.['BANK NAME'] ??
      '',
    company_name:
      raw?.company_name ??
      raw?.companyName ??
      raw?.['Company Name'] ??
      raw?.['COMPANY NAME'] ??
      '',
    account_number:
      raw?.account_number ??
      raw?.accountNumber ??
      raw?.['Account Number'] ??
      raw?.['ACCOUNT NUMBER'] ??
      '',
    period:
      raw?.period ??
      raw?.Period ??
      raw?.['Period'] ??
      raw?.['PERIOD'] ??
      '',
    no_of_months:
      raw?.no_of_months ??
      raw?.noOfMonths ??
      raw?.no_of_month ??
      raw?.['No of Months'] ??
      raw?.['NO OF MONTHS'] ??
      '',
    account_type:
      raw?.account_type ??
      raw?.accountType ??
      raw?.['Account Type'] ??
      raw?.['ACCOUNT TYPE'] ??
      '',
    cc_od_limit:
      raw?.cc_od_limit ??
      raw?.ccOdLimit ??
      raw?.cc_limit ??
      raw?.['CC/OD Limit'] ??
      raw?.['CC/OD LIMIT'] ??
      '',
    currency:
      raw?.currency ??
      raw?.Currency ??
      raw?.['Currency'] ??
      raw?.['CURRENCY'] ??
      '',
    opening_balance:
      raw?.opening_balance ??
      raw?.openingBalance ??
      raw?.['Opening Balance'] ??
      raw?.['OPENING BALANCE'] ??
      '',
    closing_balance:
      raw?.closing_balance ??
      raw?.closingBalance ??
      raw?.['Closing Balance'] ??
      raw?.['CLOSING BALANCE'] ??
      '',
  };

  const renderField = (label: string, value: unknown) => (
    <div className="border border-gray-200/90 rounded-lg px-3.5 py-2 bg-white flex flex-col justify-center min-h-[50px] transition-all">
      <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-0.5 leading-tight">
        {label}
      </span>
      <span className="text-xs md:text-[13px] font-bold text-[#000080] truncate leading-tight">
        {value !== undefined && value !== null && value !== '' ? String(value) : '\u00A0'}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 mb-6 animate-in fade-in duration-300">
      <h2 className="text-base font-bold text-[#008] mb-3.5 tracking-tight">
        Account Details
      </h2>

      {/* Row 1: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {renderField('BANK NAME', details.bank_name)}
        {renderField('COMPANY NAME', details.company_name)}
        {renderField('ACCOUNT NUMBER', details.account_number)}
        {renderField('PERIOD', details.period)}
      </div>

      {/* Row 2: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {renderField('NO OF MONTHS', details.no_of_months)}
        {renderField('ACCOUNT TYPE', details.account_type)}
        {renderField('CC/OD LIMIT', details.cc_od_limit)}
        {renderField('CURRENCY', details.currency)}
      </div>

      {/* Row 3: 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderField('OPENING BALANCE', details.opening_balance)}
        {renderField('CLOSING BALANCE', details.closing_balance)}
      </div>
    </div>
  );
}

export const BankAccountsDetails = BankAccountDetails;
export default BankAccountDetails;