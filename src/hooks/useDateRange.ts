import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

export interface DateRange {
  from_date: string;
  to_date: string;
}

export function useDateRange() {
  return useQuery<DateRange>({
    queryKey: ['report-date-range'],
    queryFn: async () => {
      const response = await apiClient.get('/bsa/report-date-range');
      return response.data?.data as DateRange;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
