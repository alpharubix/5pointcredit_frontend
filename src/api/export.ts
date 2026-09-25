import apiClient from '@/lib/axios';

export interface ExportBsaReportParams {
  account_number?: string;
  account_id?: string | number | null;
  from_date?: string;
  to_date?: string;
  cust_id?: string;
}

export const downloadBsaReport = async (
  paramsOrAccountNumber: string | ExportBsaReportParams,
  optionalAccountId?: string | number | null
): Promise<void> => {
  let account_number = '';
  let account_id = '';

  if (
    typeof paramsOrAccountNumber === 'object' &&
    paramsOrAccountNumber !== null
  ) {
    account_number = String(
      paramsOrAccountNumber.account_number ||
      paramsOrAccountNumber.account_id ||
      ''
    );
    account_id = String(
      paramsOrAccountNumber.account_id ||
      ''
    );
  } else {
    account_number = String(paramsOrAccountNumber || '');
    account_id = String(optionalAccountId || '');
  }

  const payload: Record<string, any> = {
    account_number,
  };
  if (account_id) {
    payload.account_id = account_id;
  }

  try {
    const response = await apiClient.post('/bsa/export-report', payload, {
      responseType: 'blob',
      skipErrorToast: true,
    });

    let filename = `Bsa_analysis_report_${account_number || account_id}.xlsx`;
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

    const contentType =
      typeof response.headers?.['content-type'] === 'string'
        ? response.headers['content-type']
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const blob = new Blob([response.data], {
      type: contentType,
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
          'Failed to download BSA export';
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
      'Failed to download BSA report';
    throw new Error(msg);
  }
};

export const downloadAll3ReportFiles = downloadBsaReport;
export { downloadItrReport } from './itr';
export { downloadCibilReport } from './cibil';
export { downloadGstReport } from './gst';