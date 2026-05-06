import { useState, useEffect } from "react";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Filter, X, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CashFlowSummary {
  inflows_revenue_a: number;
  outflows_expenses_b: number;
  gross_inflow_profit_c: number;
  indirect_expenses_d: number;
  indirect_income_e: number;
  net_inflow_profit_f: number;
  total_payables: number;
  total_receivables_g: number;
  bank_accruals: number;
  opening_balance: number;
  closing_balance: number;
  net_cashflow: number;
}

interface CashFlowMonth {
  MonthYear: number;
  TotalInflowPercentage: number;
  Inflow: number;
  CashDeposit: number;
  ChequeReceipt: number;
  OnlineReceipt: number;
  OtherReceipt: number;
  TotalOutflowPercentage: number;
  OutFlow: number;
  CashWithdraw: number;
  ChequePayment: number;
  OnlinePayment: number;
  OtherPayment: number;
  GrossInflow: number;
  IndirectExpense: number;
  IndirectIncome: number;
  NetInflow: number;
  Payable: number;
  Receiveble: number;
  BankAccural: number;
  OpeningBalance: number;
  ClosingBalance: number;
}

interface CashFlowData {
  summary: CashFlowSummary;
  monthly_breakdown: CashFlowMonth[];
}

export default function CashFlow() {
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
    queryKey: ["cashflow", appliedFromDate, appliedToDate],
    queryFn: async () => {
      const response = await apiClient.get(
        `/bsa/cashflow?from_month=${appliedFromDate}&to_month=${appliedToDate}`
      );
      return response.data?.data as CashFlowData;
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

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const rows = [
    {
      label: "Inflows/Revenue: (A)",
      summaryKey: "inflows_revenue_a" as keyof CashFlowSummary,
      monthKey: "Inflow" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "OutFlows/Expenses: (B)",
      summaryKey: "outflows_expenses_b" as keyof CashFlowSummary,
      monthKey: "OutFlow" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Gross Inflow/Profit (C=A-B)",
      summaryKey: "gross_inflow_profit_c" as keyof CashFlowSummary,
      monthKey: "GrossInflow" as keyof CashFlowMonth,
      bgClass: "bg-[#e6f0ff] font-semibold",
    },
    {
      label: "Less: Indirect Expenses (D)",
      summaryKey: "indirect_expenses_d" as keyof CashFlowSummary,
      monthKey: "IndirectExpense" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Add: Indirect Income (E)",
      summaryKey: "indirect_income_e" as keyof CashFlowSummary,
      monthKey: "IndirectIncome" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Net Inflow/Profit (F=C-D+E)",
      summaryKey: "net_inflow_profit_f" as keyof CashFlowSummary,
      monthKey: "NetInflow" as keyof CashFlowMonth,
      bgClass: "bg-[#e6f0ff] font-semibold",
    },
    {
      label: "Add: Receivables (g)",
      summaryKey: "total_receivables_g" as keyof CashFlowSummary,
      monthKey: "Receiveble" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Bank Accruals",
      summaryKey: "bank_accruals" as keyof CashFlowSummary,
      monthKey: "BankAccural" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Add: Opening Balance",
      summaryKey: "opening_balance" as keyof CashFlowSummary,
      monthKey: "OpeningBalance" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
    {
      label: "Closing Balance",
      summaryKey: "closing_balance" as keyof CashFlowSummary,
      monthKey: "ClosingBalance" as keyof CashFlowMonth,
      bgClass: "bg-white",
    },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in relative min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#000080] mb-2">Cash Flow</h1>
          <p className="text-gray-600">Monthwise cash flow statement analysis</p>
        </div>
      </div>

      {/* Date Filter Card */}
      <Card className="mb-8 shadow-sm border-[#000080]/10 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-input",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(new Date(fromDate + "T00:00:00"), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={dateRangeData?.from_date ? new Date(dateRangeData.from_date + "T00:00:00") : new Date(1990, 0)}
                    endMonth={dateRangeData?.to_date ? new Date(dateRangeData.to_date + "T00:00:00") : new Date(2100, 11)}
                    selected={fromDate ? new Date(fromDate + "T00:00:00") : undefined}
                    defaultMonth={fromDate ? new Date(fromDate + "T00:00:00") : undefined}
                    onSelect={(date) => setFromDate(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={(date) => {
                      if (!dateRangeData?.from_date || !dateRangeData?.to_date) return false;
                      const from = new Date(dateRangeData.from_date + "T00:00:00");
                      from.setHours(0, 0, 0, 0);
                      const to = new Date(dateRangeData.to_date + "T00:00:00");
                      to.setHours(23, 59, 59, 999);
                      return date < from || date > to;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-input",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(new Date(toDate + "T00:00:00"), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={dateRangeData?.from_date ? new Date(dateRangeData.from_date + "T00:00:00") : new Date(1990, 0)}
                    endMonth={dateRangeData?.to_date ? new Date(dateRangeData.to_date + "T00:00:00") : new Date(2100, 11)}
                    selected={toDate ? new Date(toDate + "T00:00:00") : undefined}
                    onSelect={(date) => setToDate(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={(date) => {
                      if (!dateRangeData?.from_date || !dateRangeData?.to_date) return false;
                      const from = new Date(dateRangeData.from_date + "T00:00:00");
                      from.setHours(0, 0, 0, 0);
                      const to = new Date(dateRangeData.to_date + "T00:00:00");
                      to.setHours(23, 59, 59, 999);
                      return date < from || date > to;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                Available data range: {format(new Date(dateRangeData.from_date + "T00:00:00"), "PPP")} to {format(new Date(dateRangeData.to_date + "T00:00:00"), "PPP")}.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-[#000080]/10 bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4">
          <div>
            <CardTitle className="text-xl text-[#000080]">Cash Flow Statement</CardTitle>
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
              <p>Loading cash flow data...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              <p>Error loading data: {(error as any)?.message || "Unknown error"}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">Try Again</Button>
            </div>
          ) : data ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                <thead>

                  <tr className="bg-[#1f4e78] text-white text-xs">
                    <th className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap min-w-[200px]">Particulars</th>
                    <th className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap text-right">Total (Amount)</th>
                    <th className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap text-right">Total (%)</th>
                    {expectedMonths.map((month) => (
                      <th key={month} className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap text-right capitalize">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className={`border-b border-black/10 ${row.bgClass}`}>
                      <td className="px-4 py-2.5 border border-black/20 font-medium text-gray-800 bg-gray-200/50">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 border border-black/20 text-right font-medium">
                        {formatCurrency(data.summary[row.summaryKey])}
                      </td>
                      <td className="px-4 py-2.5 border border-black/20 text-right text-gray-500">
                        {/* Total % is typically blank or computed differently, keeping blank as per reference */}
                      </td>
                      {expectedMonths.map((month, monthIndex) => {
                        // Match month data by index since API returns an array in chronological order
                        const monthData = data.monthly_breakdown[monthIndex];
                        return (
                          <td key={month} className="px-4 py-2.5 border border-black/20 text-right">
                            {monthData ? formatCurrency(monthData[row.monthKey]) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
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