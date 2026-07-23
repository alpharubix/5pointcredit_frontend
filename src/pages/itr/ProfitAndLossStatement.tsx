import { useQuery } from '@tanstack/react-query';
import { getItrProfitAndLoss } from '@/api/itr';
import CustomerProfile from '@/components/itr/CustomerProfile';
import { renderYearlyTable } from '@/components/itr/ItrTableHelper';
import { Loader2 } from 'lucide-react';

export default function ProfitAndLossStatement() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itr', 'profit-and-loss'],
    queryFn: getItrProfitAndLoss,
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
          No Data to load Profit and Loss Statement.
        </div>
      </div>
    );
  }

  const { customer_profile, profit_and_loss_statement } = data.data;

  return (
    <div className="p-6 space-y-6">
      <CustomerProfile profile={customer_profile} />

      {profit_and_loss_statement["Profit and Loss Statement"] && renderYearlyTable("Profit and Loss Statement", profit_and_loss_statement["Profit and Loss Statement"])}
    </div>
  );
}
