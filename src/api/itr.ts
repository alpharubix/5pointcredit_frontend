import apiClient from '@/lib/axios';

export const getItrTaxCalculation = async () => {
  const response = await apiClient.get('/itr/tax-calculation');
  return response.data;
};

export const getItrBalanceSheet = async () => {
  const response = await apiClient.get('/itr/balance_sheet');
  return response.data;
};

export const getItrProfitAndLoss = async () => {
  const response = await apiClient.get('/itr/profit-and-loss-statement');
  return response.data;
};

export const getItrRatioAnalysis = async () => {
  const response = await apiClient.get('/itr/ratio-analysis');
  return response.data;
};
