import { useState, useEffect } from "react";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, Filter, X } from "lucide-react";
import { toast } from "sonner";

interface MonthlyBreakdown {
  Month: string;
  AverageCreditTranx: number;
  TotalCreditNo: number;
  AverageDebitTranx: number;
  TotalDebitNo: number;
  TotalCredit: number;
  OutwardChequeReturn: number;
  ReversalOfInwardChequeReturn: number;
  ReversalOfOnlineReturn: number;
  GrossCredits: number;
  Contra: number;
  LoanReceived: number;
  NetCredits: number;
  InhouseCredit: number;
  NetCashInflow: number;
  TotalDebit: number;
  InwardChequeReturn: number;
  ReversalOfOutwardChequeReturn: number;
  OnlineReturn: number;
  GrossDebit: number;
  ContraDebit: number;
  NetDebit: number;
  InhouseDebit: number;
  NetCashOutFlow: number;
  InwardChequeReturnNos: number;
  InwardChequeReturnToTotalChequeReceivedInPercent: number;
  OutwardChequeReturnNo: number;
  OutwardChequeReturnToTotalChequePaidInPercent: number;
  InwardOnlineReturnNo: number;
  InwardOnlineReturnTototalOnlineCreditInPercent: number;
  OutwardOnlineReturnNo: number;
  OutwardOnlineReturnToTotalOnlineDebitInPercent: number;
  EcsReturnNo: number;
  EcsReturnToTotalEcsPaymentInPercent: number;
  InhouseCreditNos: number;
  InhouseCreditToTotalCreditInPercent: number;
  InhouseDebitNos: number;
  InhouseDebitToTotalDebitInPercent: number;
  AverageEod: number;
  odccLimit: number;
  odccDrawingLimit: number;
  AverageOdAndCCLimitUtilizationInPercent: number;
  NoOfdaysLimitOverDrawn: number;
  NoOfTimesLimitOverDrawn: number;
  OverDrawnAnountInRsMn: number;
  OverDrawnAverageinRsMn: number;
  OverDrawnAverageAsPercentOfOdCCLimit: number;
  PeakOverDrawingAmount: number;
  PeakOverDrawingDate: string;
  LoanRepaid: number;
  EcsPayment: number;
  NoOfUniqueEcs: number;
  InterestPaid: number;
}

interface OverviewData {
  consolidated_overall_report: {
    overview: {
      average_credit_tranx: number;
      total_credit_nos: number;
      average_debit_tranx: number;
      total_debit_nos: number;
    };
    cash_inflow: {
      total_credits_a: number;
      outward_cheque_return_b: number;
      reversal_inward_cheque_return_c: number;
      reversal_online_return_d: number;
      gross_credits_e: number;
    };
    cash_outflow: {
      total_debits_a: number;
      inward_cheque_return_b: number;
      reversal_outward_cheque_return_c: number;
      online_return_d: number;
      gross_debits_e: number;
      contra_f: number;
      net_debits_g: number;
      inhouse_debit_h: number;
      net_cash_outflow: number;
    };
    returns: {
      inward_cheque_return_nos: number;
      inward_cheque_return_percent: number;
      outward_cheque_return_nos: number;
      outward_cheque_return_percent: number;
      inward_online_return_nos: number;
      inward_online_return_percent: number;
      outward_online_return_nos: number;
      outward_online_return_percent: number;
      ecs_return_nos: number;
      ecs_return_percent: number;
    };
  };
  monthly_breakdown: MonthlyBreakdown[];
}

type RowConfig = {
  label: string;
  extraLabel?: string;
  isSeparator?: boolean;
  overallKey?: string[] | null;
  monthKey?: keyof MonthlyBreakdown;
  isCurrency?: boolean;
  isPercent?: boolean;
  isRed?: boolean;
  isItalic?: boolean;
  isBold?: boolean;
  isGreyBg?: boolean;
};

const ROWS: RowConfig[] = [
  { label: "Average Credit Tranx", overallKey: ["overview", "average_credit_tranx"], monthKey: "AverageCreditTranx", isCurrency: false },
  { label: "Total Credit (Nos.)", overallKey: ["overview", "total_credit_nos"], monthKey: "TotalCreditNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "Average Debit Tranx", overallKey: ["overview", "average_debit_tranx"], monthKey: "AverageDebitTranx", isCurrency: false },
  { label: "Total Debit (Nos.)", overallKey: ["overview", "total_debit_nos"], monthKey: "TotalDebitNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "", isSeparator: true },
  { label: "Gross Credits", extraLabel: "(E= A-B-C-D)", overallKey: ["cash_inflow", "gross_credits_e"], monthKey: "GrossCredits", isCurrency: true, isGreyBg: true },
  { label: "Net Credits", extraLabel: "(H= E-F-G)", overallKey: null, monthKey: "NetCredits", isCurrency: true, isGreyBg: true },
  { label: "Net Cash Inflow", extraLabel: "(H-I)", overallKey: null, monthKey: "NetCashInflow", isCurrency: true, isGreyBg: true },
  { label: "", isSeparator: true },
  { label: "Gross Debits", extraLabel: "(E= A-B-C-D)", overallKey: ["cash_outflow", "gross_debits_e"], monthKey: "GrossDebit", isCurrency: true, isGreyBg: true },
  { label: "Net Debits", extraLabel: "(G= E-F)", overallKey: ["cash_outflow", "net_debits_g"], monthKey: "NetDebit", isCurrency: true, isGreyBg: true },
  { label: "Net Cash Outflow", extraLabel: "(G-H)", overallKey: ["cash_outflow", "net_cash_outflow"], monthKey: "NetCashOutFlow", isCurrency: true, isGreyBg: true },
  { label: "", isSeparator: true },
  { label: "Inward Cheque Return (Nos.)", overallKey: ["returns", "inward_cheque_return_nos"], monthKey: "InwardChequeReturnNos", isCurrency: false, isRed: true, isItalic: true },
  { label: "Outward Cheque Return (Nos.)", overallKey: ["returns", "outward_cheque_return_nos"], monthKey: "OutwardChequeReturnNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "Inward Online Return (Nos.)", overallKey: ["returns", "inward_online_return_nos"], monthKey: "InwardOnlineReturnNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "Outward Online Return (Nos.)", overallKey: ["returns", "outward_online_return_nos"], monthKey: "OutwardOnlineReturnNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "ECS Return (Credit Nos.)", overallKey: ["returns", "ecs_return_nos"], monthKey: "EcsReturnNo", isCurrency: false, isRed: true, isItalic: true },
  { label: "", isSeparator: true },
  { label: "Inhouse Credit (Nos.)", overallKey: null, monthKey: "InhouseCreditNos", isCurrency: false, isRed: true, isItalic: true },
  { label: "Inhouse Debit (Nos.)", overallKey: null, monthKey: "InhouseDebitNos", isCurrency: false, isRed: true, isItalic: true },
  { label: "", isSeparator: true },
  { label: "Average EOD", overallKey: null, monthKey: "AverageEod", isCurrency: true, isBold: true },
  { label: "OD/CC Sanction Limit", overallKey: null, monthKey: "odccLimit", isCurrency: true, isBold: true },
  { label: "OD/CC Drawing Power Limit", overallKey: null, monthKey: "odccDrawingLimit", isCurrency: true, isBold: true },
  { label: "No. of days limit over-drawn", overallKey: null, monthKey: "NoOfdaysLimitOverDrawn", isCurrency: false },
  { label: "No. of times limit over-drawn", overallKey: null, monthKey: "NoOfTimesLimitOverDrawn", isCurrency: false },
  { label: "Overdrawn Amount in Rs. Mn. (for all days)", overallKey: null, monthKey: "OverDrawnAnountInRsMn", isCurrency: true },
  { label: "Overdrawn Average Amount in Rs. Mn.", overallKey: null, monthKey: "OverDrawnAverageinRsMn", isCurrency: true },
  { label: "Overdrawn Average as a %age of OD/CC Limit", overallKey: null, monthKey: "OverDrawnAverageAsPercentOfOdCCLimit", isCurrency: false, isPercent: true },
  { label: "Peak overdrawing amount", overallKey: null, monthKey: "PeakOverDrawingAmount", isCurrency: true },
  { label: "Peak overdrawing date", overallKey: null, monthKey: "PeakOverDrawingDate", isCurrency: false },
  { label: "", isSeparator: true },
  { label: "Loan Repaid", overallKey: null, monthKey: "LoanRepaid", isCurrency: true, isRed: true, isItalic: true, isBold: true },
  { label: "ECS Payment", overallKey: null, monthKey: "EcsPayment", isCurrency: true, isRed: true, isItalic: true, isBold: true },
  { label: "No. of Unique ECS/EMI's", overallKey: null, monthKey: "NoOfUniqueEcs", isCurrency: false, isRed: true, isItalic: true, isBold: true },
  { label: "Interest Paid", overallKey: null, monthKey: "InterestPaid", isCurrency: true, isBold: true },
];

export default function OverviewMonthlyWise() {
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
    queryKey: ["month-wise-overview", appliedFromDate, appliedToDate],
    queryFn: async () => {
      const response = await apiClient.get(
        `/bsa/month-wise-overview?from_date=${appliedFromDate}&to_date=${appliedToDate}`
      );
      return response.data?.data as OverviewData;
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

  const formatValue = (value: number | string | undefined | null, isCurrency: boolean, isPercent: boolean = false) => {
    if (value === undefined || value === null || value === "-" || value === "") return "-";
    if (typeof value === "string" && !isCurrency && !isPercent) return value;
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return value;

    if (isCurrency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(numValue);
    }

    if (isPercent) {
      return `${numValue.toFixed(2)}%`;
    }

    return numValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const getOverallValue = (dataObj: OverviewData | undefined, path: string[] | null): any => {
    if (!dataObj || !path) return "-";
    let current: any = dataObj.consolidated_overall_report;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return "-";
      }
    }
    return current;
  };

  const dataMap = new Map<string, MonthlyBreakdown>();
  if (data?.monthly_breakdown) {
    data.monthly_breakdown.forEach((item) => {
      dataMap.set(item.Month.toLowerCase(), item);
    });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in relative min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#000080] mb-2">Month-Wise Overview</h1>
          <p className="text-gray-600">Detailed month-wise analysis of transactions</p>
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

      <Card className="shadow-lg border-[#000080]/10 bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4">
          <div>
            <CardTitle className="text-xl text-[#000080]">Overview Details</CardTitle>
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
              <p>Loading overview data...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              <p>Error loading data: {(error as any)?.message || "Unknown error"}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">Try Again</Button>
            </div>
          ) : data ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#1f4e78] text-white text-xs">
                    <th className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap min-w-[300px]">Particulars</th>
                    <th className="px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-right bg-[#153a5b]">Overall/Total</th>
                    {expectedMonths.map((month) => (
                      <th key={month} className="px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-center capitalize">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, index) => {
                    if (row.isSeparator) {
                      return (
                        <tr key={index} className="h-1.5 bg-[#1f4e78]">
                          <td colSpan={expectedMonths.length + 2}></td>
                        </tr>
                      );
                    }

                    const labelContent = (
                      <div className={`flex justify-between items-center w-full ${row.isRed ? 'text-red-600' : 'text-gray-800'}`}>
                        <span>{row.label}</span>
                        {row.extraLabel && <span className="text-xs font-normal text-gray-600 ml-2">{row.extraLabel}</span>}
                      </div>
                    );

                    const cellClass = `px-4 py-2.5 border border-black/20 ${row.isRed ? 'text-red-600' : 'text-gray-800'} ${row.isItalic ? 'italic' : ''} ${row.isBold ? 'font-bold' : ''}`;
                    const bgClass = row.isGreyBg ? 'bg-gray-200/60' : 'bg-white';

                    return (
                      <tr key={index} className={`hover:bg-blue-50/30 transition-colors ${bgClass}`}>
                        <td className={`px-4 py-2.5 border border-black/20 font-medium ${row.isGreyBg ? 'bg-gray-300/60' : 'bg-blue-50/30'}`}>
                          {labelContent}
                        </td>
                        <td className={`text-right ${cellClass} bg-gray-100/80 font-bold`}>
                          {formatValue(getOverallValue(data, row.overallKey || null), !!row.isCurrency, !!row.isPercent)}
                        </td>
                        {expectedMonths.map((month) => {
                          const monthData = dataMap.get(month);
                          const val = monthData && row.monthKey ? monthData[row.monthKey] : undefined;
                          return (
                            <td key={month} className={`text-right ${cellClass}`}>
                              {formatValue(val, !!row.isCurrency, !!row.isPercent)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No data available for the selected date range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}