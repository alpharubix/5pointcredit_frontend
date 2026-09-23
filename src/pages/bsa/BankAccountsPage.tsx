import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  CreditCard,
  Loader2,
  RefreshCw,
  ChevronRight,
  UploadCloud,
  FileText,
  BarChart3,
  Activity,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';
import BsaUploadModal from '@/components/ui/BsaUploadModal';

import {
  getBankAccounts,
  type BankAccounts,
  getDateRange,
  type DateRange,
} from '../../api/bsa';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getAccountKey(account: BankAccounts, index: number) {
  return [account.accountNumber, account.bankCode, account.accountType, index]
    .filter(Boolean)
    .join('-');
}

export default function BankAccountsPage({
  custId,
  hideHeader,
  isAnchor,
}: { custId?: string; hideHeader?: boolean; isAnchor?: boolean } = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  /*
   * Controls whether reports are displayed
   * for each individual account.
   */
  const [showReports, setShowReports] = useState<Record<string, boolean>>({});

  /*
   * Controls upload statement modal visibility
   */
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  /*
   * Stores BSA date range for every account.
   */
  const [dateRanges, setDateRanges] = useState<Record<string, DateRange>>({});

  const {
    data: accounts = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['bsa', 'bank-accounts', custId],
    queryFn: () => getBankAccounts(custId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  /*
   * Fetch date range and determine available modules
   * for every account.
   */
  useEffect(() => {
    if (!accounts.length) return;

    const fetchAccountData = async () => {
      for (const account of accounts) {
        if (!account.accountNumber) continue;

        try {


          /*
           * Fetch BSA date range.
           */
          const data = await getDateRange(account.accountNumber);

          setDateRanges((prev) => ({
            ...prev,
            [account.accountNumber!]: data,
          }));

          console.log(
            'Account Number:',
            account.accountNumber,
            'Date fetched:',
            data
          );
        } catch (error) {
          console.error(
            'Failed to fetch data for:',
            account.accountNumber,
            error
          );
        }
      }
    };

    fetchAccountData();
  }, [accounts]);

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* =========================
            PAGE HEADER
            ========================= */}
        {!hideHeader && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Bank Accounts
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                BSA account details available for this customer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-full sm:w-auto transition-all duration-200 hover:shadow-sm"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full sm:w-auto bg-[#001D4A] hover:bg-[#001538] text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Statement
              </Button>
            </div>
          </div>
        )}

        {/* =========================
            ACCOUNTS CONTAINER
            ========================= */}
        <Card className="rounded-2x1 border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex-row items-center justify-between gap-4 border-b border-slate-100">
            <CardTitle className="text-lg">Accounts List</CardTitle>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {/* =========================
                LOADING
                ========================= */}
            {isLoading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#002366]" />

                <p className="text-sm font-medium">Fetching bank accounts...</p>
              </div>
            ) : /* =========================
               ERROR
               ========================= */
            isError ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
                <CreditCard className="h-10 w-10 text-slate-300" />

                <div>
                  <p className="font-semibold text-slate-900">
                    Could not load bank accounts
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Please refresh the list or try again later.
                  </p>
                </div>
              </div>
            ) : /* =========================
               EMPTY
               ========================= */
            accounts.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
                <Building2 className="h-10 w-10 text-slate-300" />

                <div>
                  <p className="font-semibold text-slate-900">
                    No bank accounts found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Once BSA account details are available, they will appear
                    here.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-[#001D4A] hover:bg-[#001538] text-white flex items-center gap-2 shadow-sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload Statement
                </Button>
              </div>
            ) : (
              /* =========================
               ACCOUNTS
               ========================= */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {accounts.map((account, index) => {
                  const accountNumber = account.accountNumber ?? '';

                  const reportsVisible = showReports[accountNumber];
                  const isIndividual =
                    (account.entityType || account.entity_type || '').toLowerCase() === 'individual';

                  return (
                    <div
                      key={getAccountKey(account, index)}
                      className="group relative flex flex-col h-full overflow-hidden rounded-2x1 border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                    >
                      {/* =========================
                          REPORTS VIEW
                          ========================= */}

                      {reportsVisible ? (
                        <div className="flex h-full flex-col animate-in fade-in duration-200">
                          <div className="flex h-full flex-col ">
                            {/* Reports Header */}
                            <div className="flex items-start justify-between gap-3 ">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                  Available Reports
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  Select a report to continue
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowReports((prev) => ({
                                      ...prev,
                                      [accountNumber]: false,
                                    }))
                                  }
                                  className="rounded-full bg-[#001D4A] px-3 py-1 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#001538] cursor-pointer shadow-xs"
                                >
                                  Back
                                </button>
                              </div>
                            </div>

                            {/* =========================
                                REPORT OPTIONS
                                ========================= */}

                            <div className="mt-5 space-y-2">
                              {isIndividual ? (
                                <>
                                  {/* Overview */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'individual-overview');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/individual/overview', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <FileText className="h-4 w-4" />
                                        </div>
                                        <span>Overview</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>

                                  {/* EOD Analysis */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'eod-analysis');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/individual/eod-analysis', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <BarChart3 className="h-4 w-4" />
                                        </div>
                                        <span>EOD Analysis</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>

                                  {/* Loan Transactions */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'loan-transactions');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/individual/loan-transactions', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <ArrowLeftRight className="h-4 w-4" />
                                        </div>
                                        <span>Loan Transactions</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Summary of Debit and Credit */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'summary-debit-credit');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/summary-of-debit-and-credit', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <Activity className="h-4 w-4" />
                                        </div>
                                        <span>Summary of Debit and Credit</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>

                                  {/* Cash Flow */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'cash-flow');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/cash-flow', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <ArrowLeftRight className="h-4 w-4" />
                                        </div>
                                        <span>Cash Flow</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>

                                  {/* Monthly Overview */}
                                  <button
                                    type="button"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002366]/20 hover:bg-[#002366]/5 hover:text-[#002366] hover:shadow-sm"
                                    onClick={() => {
                                      sessionStorage.setItem(
                                        'selected_bsa_account_number',
                                        accountNumber
                                      );
                                      if (isAnchor) {
                                        searchParams.set('module', 'bsa');
                                        searchParams.set('bsaView', 'overview-monthly-wise');
                                        searchParams.set('accountNumber', accountNumber);
                                        setSearchParams(searchParams);
                                      } else {
                                        navigate('/bsa/overview-monthly-wise', {
                                          state: { accountNumber },
                                        });
                                      }
                                    }}
                                    disabled={!accountNumber}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002366]/5 text-[#002366] transition-colors group-hover:bg-[#002366]/10">
                                          <Clock className="h-4 w-4" />
                                        </div>
                                        <span>Monthly Overview</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* =========================
                         NORMAL ACCOUNT CARD
                         ========================= */

                        <>
                          {/* Header */}
                          <div className="flex items-start justify-between ">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#002366]/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#002366]/15">
                              <CreditCard className="h-5 w-5 text-[#002366]" />
                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-all duration-300 group-hover:shadow-sm">
                              Active
                            </span>
                          </div>
                          {/* Bank Name & Code */}
                          <div className="mt-6 flex gap-4 justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Bank Name
                              </p>
                              <p className="mt-1 truncate text-lg font-bold tracking-wide text-slate-950">
                                {account.bank_name || 'Unavailable'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                Bank Code
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-700">
                                {account.bankCode ?? '-'}
                              </p>
                            </div>
                          </div>

                          {/* Account Number & Entity Type */}
                          <div className="mt-6 flex gap-4 justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Account Number
                              </p>
                              <p className="mt-1 truncate text-sm font-bold tracking-wide text-slate-950">
                                {account.accountNumber || 'Unavailable'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Entity Type
                              </p>
                              <p className="mt-1 text-base font-semibold text-slate-700 capitalize">
                                {account.entityType || 'Unavailable'}
                              </p>
                            </div>
                          </div>

                          {/* =========================
                              BOTTOM DETAILS
                              ========================= */}

                          <div className="mt-auto pt-5 space-y-3">
                            {/* Footer Info */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                              {/* BSA Period */}
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    BSA Period
                                  </p>

                                  <p className="truncate text-xs font-semibold text-slate-700">
                                    {dateRanges[accountNumber]
                                      ? `${formatDate(
                                          dateRanges[accountNumber]?.from_date
                                        )} → ${formatDate(
                                          dateRanges[accountNumber]?.to_date
                                        )}`
                                      : 'Loading...'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* =========================
                                VIEW REPORTS BUTTON
                                ========================= */}

                            <Button
                              type="button"
                              onClick={() =>
                                setShowReports((prev) => ({
                                  ...prev,
                                  [accountNumber]: true,
                                }))
                              }
                              className="w-full rounded-lg bg-[#002366] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#001a4d] hover:shadow-md"
                            >
                              View Reports
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Statement Modal */}
        <BsaUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => refetch()}
          custId={custId}
        />
      </div>
    </main>
  );
}
