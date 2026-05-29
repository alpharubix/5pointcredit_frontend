import apiClient from "@/lib/axios";

export const getItrTaxCalculation = async () => {
  const response = await apiClient.get("/itr/tax-calculation", {
    errorMessage: "Failed to fetch Tax Calculation. Please try again.",
  });
  return response.data;
};

export const getItrBalanceSheet = async () => {
  const response = await apiClient.get("/itr/balance_sheet", {
    errorMessage: "Failed to fetch Balance Sheet. Please try again.",
  });
  return response.data;
};

export const getItrProfitAndLoss = async () => {
  const response = await apiClient.get("/itr/profit-and-loss-statement", {
    errorMessage: "Failed to fetch Profit and Loss Statement. Please try again.",
  });
  return response.data;
};

export const getItrRatioAnalysis = async () => {
  const response = await apiClient.get("/itr/ratio-analysis", {
    errorMessage: "Failed to fetch Ratio Analysis. Please try again.",
  });
  return response.data;
};
