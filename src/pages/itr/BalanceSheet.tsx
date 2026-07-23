import { useQuery } from '@tanstack/react-query';
import { getItrBalanceSheet } from '@/api/itr';
import CustomerProfile from '@/components/itr/CustomerProfile';
import { renderYearlyTable } from '@/components/itr/ItrTableHelper';
import { Loader2 } from 'lucide-react';

export default function BalanceSheet() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itr', 'balance-sheet'],
    queryFn: getItrBalanceSheet,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#000080]" />
        </div>
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return (
      <div className="p-6 space-y-6">
        <div className="p-8 text-center text-red-500 bg-white rounded-lg shadow-sm border border-gray-100 mt-6 max-w-7xl mx-auto">
          No Data to load Balance Sheet.
        </div>
      </div>
    );
  }

  const { customer_profile, balance_sheet } = data.data;

  return (
    <div className="p-6 space-y-6">
      <CustomerProfile profile={customer_profile} />

      {balance_sheet["Equity & Liabilities"] && renderYearlyTable("Equity & Liabilities", balance_sheet["Equity & Liabilities"])}
      {balance_sheet["Assets"] && renderYearlyTable("Assets", balance_sheet["Assets"])}
    </div>
  );
}