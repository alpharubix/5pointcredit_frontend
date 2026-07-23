import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getItrRatioAnalysis } from '@/api/itr';
import CustomerProfile from '@/components/itr/CustomerProfile';
import { renderYearlyTable } from '@/components/itr/ItrTableHelper';
import { Loader2 } from 'lucide-react';

export default function RatioAnalysis() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itr', 'ratio-analysis'],
    queryFn: getItrRatioAnalysis,
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
          No Data to load Ratio Analysis.
        </div>
      </div>
    );
  }

  const { customer_profile, ratio_analysis } = data.data;

  return (
    <div className="p-6 space-y-6">
      <CustomerProfile profile={customer_profile} />

      {ratio_analysis && typeof ratio_analysis === 'object' && !Array.isArray(ratio_analysis) ? (
        Object.entries(ratio_analysis).map(([key, val]) => (
          Array.isArray(val) && val.length > 0 ? (
            <React.Fragment key={key}>
              {renderYearlyTable(key, val)}
            </React.Fragment>
          ) : null
        ))
      ) : Array.isArray(ratio_analysis) && ratio_analysis.length > 0 ? (
        renderYearlyTable("Ratio Analysis", ratio_analysis)
      ) : null}
    </div>
  );
}