import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X,
  Loader2,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateAadhaarOtp,
  validateAadhaarOtp,
  fetchAadhaarDetails,
  documentPrecheck,
  getCurrentSession,
  generateDigiLockerUrl,
  checkSessionStatus,
  listDocuments,
  getDocumentUrl,
} from '@/api/kyc';

import type { DigiLockerDocument } from '@/api/kyc';
import { useMutation, useQuery } from '@tanstack/react-query';

type KycState =
  | 'INITIALIZING'
  | 'AADHAAR_INPUT'
  | 'OTP_INPUT'
  | 'CHECK_DIGILOCKER_SESSION'
  | 'POLLING_SESSION'
  | 'FETCHING_DOCUMENTS'
  | 'SHOW_DOCUMENTS'
  | 'ERROR';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KycModal({ isOpen, onClose }: KycModalProps) {
  const [state, setState] = useState<KycState>('INITIALIZING');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [kycFlowId, setKycFlowId] = useState('');
  const [documents, setDocuments] = useState<DigiLockerDocument[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [digilockerUrl, setDigilockerUrl] = useState<string | undefined>();

  const documentLabels: Record<string, string> = {
    ADHAR: 'Aadhaar Card',
    PANCR: 'PAN Card',
  };

  const sessionStatusQuery = useQuery({
    queryKey: ['digilocker-status', kycFlowId],

    queryFn: () => checkSessionStatus(kycFlowId),

    enabled: !!kycFlowId && state === 'POLLING_SESSION',

    refetchInterval: (query) => {
      const status = query.state.data?.session_status;

      return status === 'CONSENT_PENDING' || status === 'IN_PROGRESS'
        ? 10000
        : false;
    },

    retry: 3,
  });

  useEffect(() => {
    if (isOpen) {
      startFlow();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  useEffect(() => {
    const status = sessionStatusQuery.data?.session_status;

    if (!status) return;

    if (status === 'CONSENT_APPROVED' && state !== 'SHOW_DOCUMENTS') {
      toast.success('DigiLocker consent approved!');
      fetchDocumentsList(kycFlowId);
    }

    if (
      status === 'CONSENT_REJECTED' ||
      status === 'EXPIRED' ||
      status === 'TIMEOUT' ||
      status === 'ERROR'
    ) {
      handleError(
        `DigiLocker session ended with status: ${status}. Please try again.`
      );
    }
  }, [sessionStatusQuery.data]);

  const cleanup = () => {
    toast.dismiss();
    setState('INITIALIZING');
    setAadhaarNumber('');
    setOtp('');
    setReferenceId('');
    setKycFlowId('');
    setDocuments([]);
    setErrorMsg('');
    setDigilockerUrl('');
  };

  const startFlow = async () => {
    setState('INITIALIZING');
    try {
      const precheck = await documentPrecheck();
      if (precheck?.document_list?.length > 0) {
        setDocuments(precheck.document_list);
        setKycFlowId(precheck.kyc_flow_id || '');
        setState('SHOW_DOCUMENTS');
        return;
      }
    } catch (err: any) {
      // 404 means no documents found, which is expected for new users.
      if (err?.response?.status !== 404) {
        console.error('Precheck error', err);
      }
    }

    try {
      await fetchAadhaarDetails();
      // Aadhaar exists, skip to digilocker
      setState('CHECK_DIGILOCKER_SESSION');
      checkOrGenerateSession();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setState('AADHAAR_INPUT');
      } else {
        handleError('Failed to fetch Aadhaar details.', err);
      }
    }
  };

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNumber.length !== 12) {
      toast.error('Aadhaar number must be exactly 12 digits.');
      return;
    }
    setState('INITIALIZING');
    try {
      const res = await generateAadhaarOtp(aadhaarNumber);
      setReferenceId(res.reference_id);
      toast.success('OTP sent to your registered mobile number.');
      setState('OTP_INPUT');
    } catch (err: any) {
      handleError(
        err?.response?.data?.detail?.message || 'Failed to generate OTP',
        err
      );
      setState('AADHAAR_INPUT');
    }
  };

  const handleValidateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the OTP.');
      return;
    }
    setState('INITIALIZING');
    try {
      await validateAadhaarOtp(aadhaarNumber, otp, referenceId);
      toast.success('Aadhaar verified successfully.');
      setState('CHECK_DIGILOCKER_SESSION');
      checkOrGenerateSession();
    } catch (err: any) {
      handleError(
        err?.response?.data?.detail?.message || 'Failed to validate OTP',
        err
      );
      setState('OTP_INPUT');
    }
  };

  const checkOrGenerateSession = async () => {
    try {
      const session = await getCurrentSession();
      if (session?.kyc_flow_id) {
        const statusRes = await checkSessionStatus(session.kyc_flow_id);

        if (statusRes.session_status === 'CONSENT_APPROVED') {
          fetchDocumentsList(session.kyc_flow_id);

          return;
        }
        console.log('hii', statusRes);

        setDigilockerUrl(statusRes.kyc_url);
        setKycFlowId(session.kyc_flow_id);
        setState('POLLING_SESSION');
        return;
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error('Current session error', err);
      }
    }

    try {
      const urlRes = await generateDigiLockerUrl();
      if (urlRes?.kyc_flow_id && urlRes?.digilocker_url) {
        setKycFlowId(urlRes.kyc_flow_id);
        setDigilockerUrl(urlRes.digilocker_url);
        setState('POLLING_SESSION');

        window.open(urlRes.digilocker_url, '_blank');
      } else {
        handleError('Invalid response from DigiLocker URL generation.');
      }
    } catch (err: any) {
      handleError(
        err?.response?.data?.detail?.message ||
          'Failed to generate DigiLocker URL',
        err
      );
    }
  };

  const fetchDocumentsList = async (flowId: string) => {
  setState('FETCHING_DOCUMENTS');

  try {
    const res = await listDocuments(flowId);

    console.log("API Response:", res);
    console.log("Document List:", res.document_list);

    const docs = res.document_list || [];

    if (docs.length === 0) {
      toast.info('No documents found in DigiLocker.');
      setDocuments([]);
      setState('SHOW_DOCUMENTS');
      return;
    }

    setDocuments(docs);
    setState('SHOW_DOCUMENTS');
  } catch (err: any) {
    handleError(
      err?.response?.data?.detail?.message ||
        'Failed to fetch documents from DigiLocker',
      err
    );
  }
};

  const handleError = (msg: string, err?: any) => {
    console.error(msg, err);
    setErrorMsg(msg);
    setState('ERROR');
  };

 const viewDocumentMutation = useMutation({
  mutationFn: async (doc: DigiLockerDocument) => {
    console.log("DOC:", doc);

    return getDocumentUrl(
      kycFlowId,
      "pdf",
      doc.uri,
      doc.documentType
    );
  },

  onSuccess: (data) => {
    console.log("API Response:", data);

    if (!data || !data.documentUrl) {
      toast.error("Document URL not found");
      return;
    }

    window.open(data.documentUrl, "_blank");
  },

  onError: (error: any) => {
    console.error("API Error:", error);
    toast.error("Failed to open document");
  },
});

const handleViewDocument = (doc: DigiLockerDocument) => {
  viewDocumentMutation.mutate(doc);
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <Card className="w-full max-w-md shadow-2xl relative mx-4 max-h-[90vh] flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-gray-500 hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl text-[#000080] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Identity Verification
          </CardTitle>
          <CardDescription>
            Complete your KYC using Aadhaar and DigiLocker
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {state === 'INITIALIZING' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
              <p className="text-sm text-gray-500">
                Checking verification status...
              </p>
            </div>
          )}

          {state === 'AADHAAR_INPUT' && (
            <form
              onSubmit={handleGenerateOtp}
              className="space-y-4 animate-fade-in"
            >
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">
                  Aadhaar Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="aadhaarNumber"
                  type="text"
                  placeholder="Enter 12-digit Aadhaar"
                  value={aadhaarNumber}
                  onChange={(e) =>
                    setAadhaarNumber(
                      e.target.value.replace(/\D/g, '').slice(0, 12)
                    )
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#000080] hover:bg-[#000060]"
                disabled={aadhaarNumber.length !== 12}
              >
                Generate OTP
              </Button>
            </form>
          )}

          {state === 'OTP_INPUT' && (
            <form
              onSubmit={handleValidateOtp}
              className="space-y-4 animate-fade-in"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">
                  Aadhaar OTP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  OTP sent to your Aadhaar-linked mobile number.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#000080] hover:bg-[#000060]"
                disabled={otp.length !== 6}
              >
                Validate OTP
              </Button>
            </form>
          )}

          {state === 'CHECK_DIGILOCKER_SESSION' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in">
              <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
              <p className="text-sm text-gray-500">
                Initializing DigiLocker session...
              </p>
            </div>
          )}

          {state === 'POLLING_SESSION' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  Awaiting your consent
                </p>
                <p className="text-sm text-gray-500">
                  Please complete the DigiLocker authorization in the new
                  window.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStatusQuery.refetch();
                  window.open(digilockerUrl, '_blank');
                }}
                className="mt-4 gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Open Window Again
              </Button>
            </div>
          )}

          {state === 'FETCHING_DOCUMENTS' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in">
              <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
              <p className="text-sm text-gray-500">
                Retrieving documents from DigiLocker...
              </p>
            </div>
          )}

          {state === 'SHOW_DOCUMENTS' && (
            <div className="space-y-4 animate-fade-in">
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No documents found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck2 className="h-8 w-8 text-[#000080]" />
                        <div>
                          <p className="font-medium text-sm">
                            {documentLabels[doc.documentType] ??
                              doc.documentType}
                          </p>
                          <p className="text-xs text-gray-500">
  {doc.fileFormat?.join(", ")}
</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={viewDocumentMutation.isPending}
                        onClick={() => handleViewDocument(doc)}
                      >
                        {viewDocumentMutation.isPending ? 'Opening...' : 'View'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={onClose}
                className="w-full bg-[#000080] hover:bg-[#000060]"
              >
                Done
              </Button>
            </div>
          )}

          {state === 'ERROR' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in text-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-red-600">Verification Failed</p>
                <p className="text-sm text-gray-500">{errorMsg}</p>
              </div>
              <div className="flex gap-3 mt-4 w-full">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={startFlow}
                  className="flex-1 bg-[#000080] hover:bg-[#000060]"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
