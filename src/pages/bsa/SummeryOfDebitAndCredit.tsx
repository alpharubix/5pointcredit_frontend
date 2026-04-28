import { useState, useEffect } from "react";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, Filter, X } from "lucide-react";
import { toast } from "sonner";
// import { useNavigate } from "react-router-dom";

interface MonthlyBreakdown {
  month: string;
  inflows_value: { total_receipt_inflows_value: number };
  inflows_no: { total_receipt_inflows_no: number };
  outflows_value: { total_payments_outflows_value: number };
  outflows_no: { total_payments_outflows_no: number };
}

interface SummaryData {
  _id: string;
  monthly_breakdown: MonthlyBreakdown[];
  total: {
    total_receipt_inflows_value: number;
    total_receipt_inflows_no: number;
    total_payments_outflows_value: number;
    total_payments_outflows_no: number;
  };
}

export default function SummeryOfDebitAndCredit() {
  // const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const { data: dateRangeData } = useQuery({
    queryKey: ["report-date-range"],
    queryFn: async () => {
      const response = await apiClient.get("/bsa/report-date-range");
      return response.data?.data as { from_date: string; to_date: string };
    },
  });

  useEffect(() => {
    if (dateRangeData && !appliedFromDate && !appliedToDate) {
      const from = new Date(dateRangeData.from_date);
      const to = new Date(dateRangeData.to_date);

      const defaultTo = new Date(from);
      defaultTo.setMonth(defaultTo.getMonth() + 12);
      defaultTo.setDate(defaultTo.getDate() - 1);

      const finalTo = to < defaultTo ? to : defaultTo;

      const startStr = from.toISOString().split("T")[0];
      const endStr = finalTo.toISOString().split("T")[0];

      setFromDate(startStr);
      setToDate(endStr);
      setAppliedFromDate(startStr);
      setAppliedToDate(endStr);
    }
  }, [dateRangeData, appliedFromDate, appliedToDate]);

  const handleApply = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }

    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);

    if (d1 > d2) {
      toast.error("From Date cannot be later than To Date");
      return;
    }

    const maxDateAllowed = new Date(d1);
    maxDateAllowed.setMonth(maxDateAllowed.getMonth() + 12);

    if (d2 > maxDateAllowed) {
      toast.error("You can only select a maximum of 12 months at a time. Please adjust the range.");
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleClear = () => {
    if (dateRangeData) {
      const from = new Date(dateRangeData.from_date);
      const to = new Date(dateRangeData.to_date);

      const defaultTo = new Date(from);
      defaultTo.setMonth(defaultTo.getMonth() + 12);
      defaultTo.setDate(defaultTo.getDate() - 1);

      const finalTo = to < defaultTo ? to : defaultTo;

      const startStr = from.toISOString().split("T")[0];
      const endStr = finalTo.toISOString().split("T")[0];

      setFromDate(startStr);
      setToDate(endStr);
      setAppliedFromDate(startStr);
      setAppliedToDate(endStr);
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["summary-of-debit-and-credit", appliedFromDate, appliedToDate],
    queryFn: async () => {
      const response = await apiClient.get(
        `/bsa/summary-of-debit-and-credit_monthwise?from_date=${appliedFromDate}&to_date=${appliedToDate}`
      );
      return response.data?.data as SummaryData;
    },
    enabled: !!appliedFromDate && !!appliedToDate,
  });

  const generateMonthsRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const months = [];
    const current = new Date(startStr);
    current.setDate(1); // Set to 1st of the month
    const end = new Date(endStr);

    let count = 0;
    while (current <= end && count < 12) {
      const month = current.toLocaleString("en-US", { month: "short" }).toLowerCase();
      const year = current.getFullYear();
      months.push(`${month} ${year}`);
      current.setMonth(current.getMonth() + 1);
      count++;
    }
    return months;
  };

  const expectedMonths = generateMonthsRange(appliedFromDate, appliedToDate);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const dataMap = new Map<string, MonthlyBreakdown>();
  if (data?.monthly_breakdown) {
    data.monthly_breakdown.forEach((item) => {
      dataMap.set(item.month.toLowerCase(), item);
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in relative min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#000080] mb-2">Summary of Debit and Credit</h1>
          <p className="text-gray-600">Monthwise breakdown of inflows and outflows</p>
        </div>
      </div>

      <Card className="mb-8 shadow-sm border-[#000080]/10 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <Input
                type="date"
                value={fromDate}
                min={dateRangeData?.from_date}
                max={dateRangeData?.to_date}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <Input
                type="date"
                value={toDate}
                min={dateRangeData?.from_date}
                max={dateRangeData?.to_date}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} className="bg-[#000080] hover:bg-[#000080]/90 text-white gap-2">
                <Filter className="w-4 h-4" /> Apply Filter
              </Button>
              <Button onClick={handleClear} variant="outline" className="gap-2">
                <X className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            * You can select a maximum date range of 12 months.
            {dateRangeData && (
              <span className="ml-1">
                Available data range: {dateRangeData.from_date} to {dateRangeData.to_date}.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-[#000080]/10 bg-white">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4">
          <div>
            <CardTitle className="text-xl text-[#000080]">Monthly Overview</CardTitle>
            <CardDescription>
              {appliedFromDate && appliedToDate ? `From ${appliedFromDate} to ${appliedToDate}` : "Select a date range"}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#000080] mb-4" />
              <p>Loading summary data...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              <p>Error loading data: {(error as any)?.message || "Unknown error"}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100/80 border-b">
                  <tr className="bg-[#1f4e78] text-white text-xs">
                    <th scope="col" className="px-6 py-4 font-semibold">Month</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Inflows (Receipts) - (No.)</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Inflows (Receipts) - (Val.)</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Outflows (Payments) - (No.)</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Outflows (Payments) - (Val.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expectedMonths.map((month) => {
                    const monthData = dataMap.get(month);

                    return (
                      <tr key={month} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                          {month}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {monthData ? monthData.inflows_no.total_receipt_inflows_no : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          {monthData ? formatCurrency(monthData.inflows_value.total_receipt_inflows_value) : "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {monthData ? monthData.outflows_no.total_payments_outflows_no : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">
                          {monthData ? formatCurrency(monthData.outflows_value.total_payments_outflows_value) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {data?.total && (
                  <tfoot className="bg-blue-50/50 font-bold border-t-2 border-[#000080]/20">
                    <tr>
                      <td className="px-6 py-4 text-[#000080]">Total</td>
                      <td className="px-6 py-4 text-right text-gray-800">
                        {data.total.total_receipt_inflows_no}
                      </td>
                      <td className="px-6 py-4 text-right text-green-700">
                        {formatCurrency(data.total.total_receipt_inflows_value)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800">
                        {data.total.total_payments_outflows_no}
                      </td>
                      <td className="px-6 py-4 text-right text-red-700">
                        {formatCurrency(data.total.total_payments_outflows_value)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}