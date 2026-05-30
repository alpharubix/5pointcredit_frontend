import { useQuery } from '@tanstack/react-query';
import { getGstHistory } from '@/api/gst';
import { useNavigate } from 'react-router-dom';

export default function GstHistoryPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gstHistory'],
    queryFn: getGstHistory,
    retry: false,
  });

  const historyList = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              GST Analysis History
            </h1>
            <p className="text-gray-500 mt-1">
              View your previous GST submissions
            </p>
          </div>
          <button
            onClick={() => navigate('/gst/analysis')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#000080] hover:bg-[#000060] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000080]"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Analysis
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No History Found
            </h3>
            <p className="text-gray-500 mb-4">
              You haven't made any GST submissions yet.
            </p>
            <button
              onClick={() => navigate('/gst/analysis')}
              className="text-[#000080] font-medium hover:underline"
            >
              Start your first analysis
            </button>
          </div>
        ) : historyList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No submissions found.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Reference ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Period
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyList.map((item) => (
                  <tr key={item.reference_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.reference_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.from_month} - {item.to_month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.gst_reference_id_status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : item.gst_reference_id_status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.gst_reference_id_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {item.gst_reference_id_status === 'COMPLETED' ? (
                        <button
                          onClick={() =>
                            navigate('/gst/reports', {
                              state: { gst_reference_id: item.reference_id },
                            })
                          }
                          className="text-[#000080] hover:text-[#000060]"
                        >
                          View Report
                        </button>
                      ) : (
                        <span className="text-gray-300">View Report</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
