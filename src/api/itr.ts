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

export const downloadItrReport = async (custId?: string): Promise<void> => {
  try {
    const response = await apiClient.get('/itr/export-report', {
      params: custId ? { cust_id: custId } : undefined,
      responseType: 'blob',
      skipErrorToast: true,
    });

    let filename = 'ITR_Report.xlsx';
    const rawDisposition =
      response.headers?.['content-disposition'] ||
      response.headers?.['Content-Disposition'];
    const disposition =
      typeof rawDisposition === 'string' ? rawDisposition : undefined;

    if (disposition) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = new Blob([response.data], {
      type:
        typeof response.headers?.['content-type'] === 'string'
          ? response.headers['content-type']
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
  } catch (error: any) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        const serverMsg =
          json.detail?.message ||
          json.detail ||
          json.message ||
          'Failed to download ITR export';
        throw new Error(
          typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)
        );
      } catch (parseErr: any) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
    const msg =
      error.response?.data?.detail?.message ||
      error.response?.data?.message ||
      error.message ||
      'Failed to download ITR report';
    throw new Error(msg);
  }
};

