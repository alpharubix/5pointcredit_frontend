import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

export interface DateRange {
  from_date: string;
  to_date: string;
}

export function useDateRange(accountNumber?: string) {
  const searchAcc =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('accountNumber') || ''
      : '';
  const resolvedAccount =
    accountNumber ||
    searchAcc ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('selected_bsa_account_number') || ''
      : '');

  if (resolvedAccount && typeof window !== 'undefined') {
    sessionStorage.setItem('selected_bsa_account_number', resolvedAccount);
  }

  return useQuery<DateRange>({
    queryKey: ['report-date-range', resolvedAccount],
    queryFn: async () => {
      // Try POST with account_number first (as required by current backend)
      if (resolvedAccount) {
        try {
          const postRes = await apiClient.post('/bsa/report-date-range', {
            account_number: resolvedAccount,
          });
          const data = postRes.data?.data ?? postRes.data;
          if (data?.from_date && data?.to_date) {
            return data as DateRange;
          }
        } catch (err: any) {
          if (err?.response?.status !== 405 && err?.response?.status !== 404) {
            // If it's a real server/auth error, throw unless 405/404 method fallback is needed
            // Fall through to GET attempt
          }
        }
      }

      // Fallback to GET with query params
      const response = await apiClient.get('/bsa/report-date-range', {
        params: resolvedAccount ? { account_number: resolvedAccount } : undefined,
      });
      return (response.data?.data ?? response.data) as DateRange;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
