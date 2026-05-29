import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  FileText,
  Building2,
  CreditCard,
  PieChart,
  ShieldCheck,
  UploadCloud,
  X,
  CheckCircle2,
  CalendarDays,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from '@/components/ui/select';

interface Bank {
  srNo: number;
  bankName: string;
  code: string;
}

interface UploadFileInfo {
  starting_date: string;
  ending_date: string;
}

interface UploadResponse {
  data: {
    upload_ref_id: string;
    [fileName: string]: any;
  };
}

interface ParsedUploadResult {
  upload_ref_id: string;
  files: {
    name: string;
    starting_date: string;
    ending_date: string;
  }[];
}

function parseUploadResponse(raw: UploadResponse['data']): ParsedUploadResult {
  const { upload_ref_id, ...fileEntries } = raw;
  const files = Object.entries(fileEntries).map(([name, info]) => ({
    name,
    starting_date: (info as UploadFileInfo).starting_date,
    ending_date: (info as UploadFileInfo).ending_date,
  }));
  return { upload_ref_id, files };
}

type ModalStep = 'form' | 'confirmation';

type ITRState =
  | 'EMAIL_INPUT'
  | 'AWAITING_CREDENTIAL_SUBMISSION'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'ERROR'
  | 'INITIALIZING';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('form');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<ParsedUploadResult | null>(
    null
  );

  const [isItrModalOpen, setIsItrModalOpen] = useState(false);
  const [itrState, setItrState] = useState<ITRState>('INITIALIZING');
  const [itrEmail, setItrEmail] = useState('');
  const [itrReferenceId, setItrReferenceId] = useState<string | null>(
    localStorage.getItem('itr_reference_id')
  );
  const [itrLinkUrl, setItrLinkUrl] = useState<string | null>(
    localStorage.getItem('itr_link_url')
  );

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    entityName: '',
    companyType: '',
    accountNumber: '',
    accountType: '',
    bankCode: '',
  });

  const { data: banks, isLoading: isLoadingBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await apiClient.get('/bsa/get-bank-names');
      return response.data?.data as Bank[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: FormData) => {
      const response = await apiClient.post('/bsa/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as UploadResponse;
    },
    onSuccess: (data) => {
      const parsed = parseUploadResponse(data.data);
      setUploadResult(parsed);
      setModalStep('confirmation');
    },
    onError: (error: any) => {
      toast.error(`${error.response?.data?.detail?.message}`);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (upload_ref_id: string) => {
      const response = await apiClient.post('/bsa/upload_ref_id', {
        upload_ref_id,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message ?? 'Statement confirmed successfully!');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(`${error.response?.data?.detail?.message}`);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStep('form');
    setUploadResult(null);
    setSelectedFiles([]);
    setFormData({
      entityName: '',
      companyType: '',
      accountNumber: '',
      accountType: '',
      bankCode: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
    if (!formData.bankCode) {
      toast.error('Please select a bank');
      return;
    }

    const formPayload = new FormData();
    const jsonString = JSON.stringify({
      entityName: formData.entityName,
      entityType: formData.companyType,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      bankCode: formData.bankCode,
    });
    formPayload.append('data', jsonString);
    selectedFiles.forEach((file) => {
      formPayload.append('files', file);
    });

    uploadMutation.mutate(formPayload);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const { data: itrPrecheckData } = useQuery({
    queryKey: ['itr-data-precheck'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/itr/link-precheck');
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 409) {
          return error.response.data.detail;
        }
        throw error;
      }
    },
    enabled: isItrModalOpen,
  });

  useEffect(() => {
    const payload = itrPrecheckData?.detail?.data || itrPrecheckData?.data;

    if (payload) {
      const { is_proceed, itr_reference_id, link_url } = payload;

      if (itr_reference_id) {
        setItrReferenceId(itr_reference_id);
        localStorage.setItem('itr_reference_id', itr_reference_id);
      }

      if (link_url) {
        setItrLinkUrl(link_url);
        localStorage.setItem('itr_link_url', link_url);
      }

      if (itr_reference_id) {
        setItrState('PROCESSING');
      } else if (is_proceed) {
        setItrState('EMAIL_INPUT');
      } else {
        setItrState('EMAIL_INPUT');
      }
    } else if (
      itrPrecheckData &&
      !itrPrecheckData.data &&
      !itrPrecheckData.detail
    ) {
      setItrState('EMAIL_INPUT');
    }
  }, [itrPrecheckData]);

  const { data: itrPollingData } = useQuery({
    queryKey: ['itr-polling', itrReferenceId],
    queryFn: async () => {
      const res = await apiClient.post('/itr/check-link-status', {
        itr_reference_id: itrReferenceId,
      });
      return res.data;
    },
    enabled:
      isItrModalOpen &&
      !!itrReferenceId &&
      (itrState === 'AWAITING_CREDENTIAL_SUBMISSION' ||
        itrState === 'PROCESSING'),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (itrPollingData?.data) {
      const { link_response_code } = itrPollingData.data;
      if (link_response_code === 'SRC001') {
        setItrState('SUCCESS');
      } else if (link_response_code === 'ECR214') {
        setItrState('TIMEOUT');
      } else if (link_response_code === 'ENR029') {
        setItrState('EMAIL_INPUT');
        setItrReferenceId(null);
        localStorage.removeItem('itr_reference_id');
        toast.error('Session not found');
      } else if (
        link_response_code === 'EBF017' ||
        link_response_code === 'EIP018'
      ) {
        setItrState('ERROR');
        toast.error('Invalid request');
      } else if (link_response_code === 'RNP020') {
        setItrState('PROCESSING');
      } else if (link_response_code === 'ENC220') {
        setItrState('AWAITING_CREDENTIAL_SUBMISSION');
      }
    }
  }, [itrPollingData]);

  const generateItrLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post('/itr/generate-link', {
        email_id: email,
      });
      return res.data;
    },
    onSuccess: (data) => {
      const { link_url } = data;
      const refId = data.data?.itr_reference_id;

      if (refId) {
        setItrReferenceId(refId);
        localStorage.setItem('itr_reference_id', refId);
      }
      if (link_url) {
        setItrLinkUrl(link_url);
        localStorage.setItem('itr_link_url', link_url);
        setItrState('AWAITING_CREDENTIAL_SUBMISSION');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail?.message || 'Failed to generate link'
      );
    },
  });

  const dashboardItems = [
    {
      title: 'Bank Statement Analysis',
      description: 'Upload & Analysis',
      icon: <Building2 className="h-8 w-8 text-[#000080]" />,
      onClick: () => {
        setModalStep('form');
        setIsModalOpen(true);
      },
      disabled: false,
    },
    {
      title: 'GSTR Analysis',
      description: 'Analysis GSTR',
      icon: <FileText className="h-8 w-8 text-[#000080]" />,
      onClick: () => {
        navigate('/gst/analysis');
      },
      disabled: false,
    },
    {
      title: 'ITR',
      description: 'Income Tax Return',
      icon: <PieChart className="h-8 w-8 text-[#000080]" />,
      disabled: false,
      onClick: () => {
        setIsItrModalOpen(true);
      },
    },
    {
      title: 'CIBIL Score',
      description: 'Credit Report',
      icon: <CreditCard className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
    {
      title: 'KYC',
      description: 'Identity Verification',
      icon: <ShieldCheck className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
  ];

  return (
    <div className="p-8 animate-fade-in relative min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#000080] mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Access your financial documents and analysis tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item, index) => (
          <Card
            key={index}
            className={`transition-all duration-300 ${
              item.disabled
                ? 'opacity-60 cursor-not-allowed bg-gray-50'
                : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer border-[#000080]/20 hover:border-[#000080]/50 bg-white'
            }`}
            onClick={!item.disabled ? item.onClick : undefined}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div
                className={`p-3 rounded-xl ${item.disabled ? 'bg-gray-200' : 'bg-blue-50'}`}
              >
                {item.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!item.disabled && (
                <div className="mt-4 flex items-center text-sm font-medium text-[#000080]">
                  Click to proceed <span className="ml-2">→</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl relative animate-scale-in">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* ── STEP 1: Upload Form ── */}
            {modalStep === 'form' && (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl text-[#000080] flex items-center gap-2">
                    <UploadCloud className="h-6 w-6" />
                    Upload Bank Statement
                  </CardTitle>
                  <CardDescription>
                    Provide details and upload your bank statement for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyType">
                          Company Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.companyType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, companyType: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Company Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Company Type</SelectLabel>
                              <SelectItem value="individual">
                                Individual
                              </SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                              <SelectItem value="sole_proprietorship">
                                Sole Proprietorship
                              </SelectItem>
                              <SelectItem value="trust">Trust</SelectItem>
                              <SelectItem value="partnership">
                                Partnership
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountType">
                          Account Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.accountType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, accountType: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Account Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Account Type</SelectLabel>
                              <SelectItem value="CURRENT">CURRENT</SelectItem>
                              <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                              <SelectItem value="Over Draft(OD)">
                                Over Draft(OD)
                              </SelectItem>
                              <SelectItem value="Cash Credit(CC)">
                                Cash Credit(CC)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="Enter account number"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankCode">
                        Select Bank <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="bankCode"
                        name="bankCode"
                        value={formData.bankCode}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="" disabled>
                          Select a bank
                        </option>
                        {isLoadingBanks ? (
                          <option disabled>Loading banks...</option>
                        ) : (
                          banks?.map((bank, idx) => (
                            <option key={idx} value={bank.code}>
                              {bank.bankName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">
                        Statement Files <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-col gap-2 w-full">
                        <Input
                          id="file"
                          type="file"
                          multiple={true}
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              setSelectedFiles((prev) => [
                                ...prev,
                                ...newFiles,
                              ]);
                              e.target.value = ''; // Reset input to allow selecting the same file again if removed
                            }
                          }}
                          className="cursor-pointer file:cursor-pointer file:bg-[#000080]/5 file:text-[#000080] file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-[#000080]/10 transition-all"
                        />

                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-md bg-blue-50/30"
                              >
                                <span
                                  className="text-sm text-gray-700 truncate mr-2"
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFiles((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#000080] hover:bg-[#000060] mt-6"
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload & Analyze'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {/* ── STEP 2: Confirmation ── */}
            {modalStep === 'confirmation' && uploadResult && (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl text-[#000080] flex items-center gap-2">
                    <FileCheck2 className="h-6 w-6" />
                    Confirm Statement Details
                  </CardTitle>
                  <CardDescription>
                    Please review the extracted details before confirming
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File cards */}
                  {uploadResult.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#000080]/20 bg-blue-50/40 p-4 space-y-3"
                    >
                      {/* File name */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#000080] shrink-0" />
                        <span className="text-sm font-semibold text-[#000080] truncate">
                          {file.name}
                        </span>
                      </div>

                      {/* Date range */}
                      <div className="flex items-center gap-6 pl-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 text-[#000080]/60 shrink-0" />
                          <span className="font-medium text-gray-500">
                            From:
                          </span>
                          <span className="font-semibold text-gray-800">
                            {file.starting_date}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 text-[#000080]/60 shrink-0" />
                          <span className="font-medium text-gray-500">To:</span>
                          <span className="font-semibold text-gray-800">
                            {file.ending_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-[#000080]/30 text-[#000080] hover:bg-[#000080]/5"
                      onClick={() => setModalStep('form')}
                      disabled={confirmMutation.isPending}
                    >
                      ← Go Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-[#000080] hover:bg-[#000060]"
                      onClick={() =>
                        confirmMutation.mutate(uploadResult.upload_ref_id)
                      }
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── ITR Modal ── */}
      {isItrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsItrModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader>
              <CardTitle className="text-2xl text-[#000080] flex items-center gap-2">
                <PieChart className="h-6 w-6" />
                Income Tax Return
              </CardTitle>
              <CardDescription>
                Fetch and analyze your ITR data securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {itrState === 'INITIALIZING' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#000080] mb-4" />
                  <p className="text-gray-600">Checking ITR status...</p>
                </div>
              )}

              {itrState === 'EMAIL_INPUT' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itrEmail">Email Address</Label>
                    <Input
                      id="itrEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={itrEmail}
                      onChange={(e) => setItrEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-[#000080] hover:bg-[#000060]"
                    onClick={() => generateItrLinkMutation.mutate(itrEmail)}
                    disabled={generateItrLinkMutation.isPending || !itrEmail}
                  >
                    {generateItrLinkMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate Link
                  </Button>
                </div>
              )}

              {itrState === 'AWAITING_CREDENTIAL_SUBMISSION' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-full mb-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
                  </div>
                  <p className="text-center font-medium text-[#000080]">
                    Waiting for credential submission
                  </p>
                  <p className="text-center text-sm text-gray-500 mb-4">
                    Please click the button below to verify your ITR
                    credentials.
                  </p>
                  <Button
                    className="w-full bg-[#000080] hover:bg-[#000060]"
                    onClick={() => {
                      if (itrLinkUrl) {
                        window.open(itrLinkUrl, '_blank');
                      } else {
                        toast.error('Verification link not found.');
                      }
                    }}
                  >
                    Verify ITR
                  </Button>
                </div>
              )}

              {itrState === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-full mb-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#000080]" />
                  </div>
                  <p className="text-center font-medium text-[#000080]">
                    Analyzing your ITR data...
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    This may take a few moments. Please wait.
                  </p>
                </div>
              )}

              {itrState === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-green-50 rounded-full mb-2">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-center font-medium text-green-700">
                    ITR Analysis Report already exists!
                  </p>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                    onClick={() => {
                      setIsItrModalOpen(false);
                      navigate('/itr/itr-tax-calculation');
                    }}
                  >
                    View ITR Analysis
                  </Button>
                </div>
              )}

              {itrState === 'TIMEOUT' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-red-50 rounded-full mb-2">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-center font-medium text-red-700">
                    Verification session expired
                  </p>
                  <Button
                    className="w-full bg-[#000080] hover:bg-[#000060] mt-4"
                    onClick={() => setItrState('EMAIL_INPUT')}
                  >
                    Regenerate Link
                  </Button>
                </div>
              )}

              {itrState === 'ERROR' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-red-50 rounded-full mb-2">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-center font-medium text-red-700">
                    Invalid request
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setItrState('EMAIL_INPUT')}
                  >
                    Go Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
