import React, { useState, useEffect } from 'react';
import apiClient, { extractErrorMessage } from '@/lib/axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
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
  HelpCircle,
  ShoppingCart,
  Minus,
  Plus,
  BriefcaseBusiness,
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
import { KycModal } from '@/components/KycModal';
import PaymentModal from '@/components/cart/PaymentModal';
import { getPricingDetails } from '@/lib/paymentUtils';
import { getWalletBalance, type ServiceBreakup } from '@/api/payment';
import { useAuthContext } from '@/contexts/AuthContext';

interface Bank {
  srNo: number;
  bankName: string;
  code: string;
}

interface UploadFileInfo {
  bank_name: string | null;
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
    bank_name: string | null;
    starting_date: string;
    ending_date: string;
  }[];
}

function parseUploadResponse(raw: UploadResponse['data']): ParsedUploadResult {
  const { upload_ref_id, ...fileEntries } = raw;
  const files = Object.entries(fileEntries).map(([name, info]) => ({
    name,
    bank_name: (info as UploadFileInfo).bank_name ?? null,
    starting_date: (info as UploadFileInfo).starting_date,
    ending_date: (info as UploadFileInfo).ending_date,
  }));
  return { upload_ref_id, files };
}

type ModalStep = 'form' | 'confirmation';

type ITRState =
  | 'INITIALIZING'
  | 'EMAIL_INPUT'
  | 'AWAITING_CREDENTIAL_SUBMISSION'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'ERROR';

const mapResponseCodeToState = (code?: string): ITRState => {
  switch (code) {
    case 'ENC220':
      return 'AWAITING_CREDENTIAL_SUBMISSION';
    case 'RNP020':
      return 'PROCESSING';
    case 'SRC001':
      return 'SUCCESS';
    case 'ECR214':
      return 'TIMEOUT';
    case 'ENR029':
      return 'EMAIL_INPUT';
    case 'EBF017':
    case 'EIP018':
      return 'ERROR';
    default:
      return 'EMAIL_INPUT';
  }
};

export default function DashboardPage() {
  const { user } = useAuthContext() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedService, setHighlightedService] = useState<string | undefined>(undefined);

  // BSA Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('form');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<ParsedUploadResult | null>(null);

  // Other Modals
  const [isItrModalOpen, setIsItrModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [itrState, setItrState] = useState<ITRState>('INITIALIZING');
  const [itrEmail, setItrEmail] = useState('');
  const [itrReferenceId, setItrReferenceId] = useState<string | null>(null);

  // Cart & Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({
    BSA: 1,
    GST: 1,
    ITR: 1,
    CIBIL: 1,
  });

  const [companyName, setCompanyName] = useState<string>('');

  const [formData, setFormData] = useState({
    entityName: '',
    companyType: '',
    accountNumber: '',
    accountType: '',
    bankCode: '',
  });

  useEffect(() => {
    const savedName =
      sessionStorage.getItem('company_name') ||
      user?.company_name ||
      user?.customer_name ||
      user?.name ||
      '';
    setCompanyName(savedName);
  }, [user]);

  // Lock background scroll when any modal is open to keep background standard & fixed
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isItrModalOpen || isKycModalOpen || checkoutOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isItrModalOpen, isKycModalOpen, checkoutOpen]);

  // Highlight Service when redirected from wallet-protected route
  useEffect(() => {
    const service = location.state?.highlight as string | undefined;

    if (!service) {
      return;
    }

    setHighlightedService(service);
    setQuantities((prev) => ({
      ...prev,
      [service]: Math.max(1, prev[service] || 1),
    }));

    const timer = setTimeout(() => {
      setHighlightedService(undefined);
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.state]);

  // Cart logic
  const updateQuantity = (service: string, change: number) => {
    setQuantities((current) => ({
      ...current,
      [service]: Math.min(10, Math.max(0, (current[service] || 0) + change)),
    }));
  };

  const cartItems = [
    {
      service: 'BSA',
      label: 'Bank Statement Analysis',
      period: '12 month period for 1 Bank Acc.',
      pricing: getPricingDetails('BSA', 1),
    },
    {
      service: 'GST',
      label: 'Goods & Services Tax',
      period: '12 month period for 1 GST No.',
      pricing: getPricingDetails('GST', 1),
    },
    {
      service: 'ITR',
      label: 'Income Tax Returns',
      period: '2 Financial Years for 1 Business',
      pricing: getPricingDetails('ITR', 1),
    },
    {
      service: 'CIBIL',
      label: 'CIBIL Credit Report',
      period: 'Credit Bureau Records till date',
      pricing: getPricingDetails('CIBIL', 1),
    },
  ].map((item) => ({
    ...item,
    qty: quantities[item.service] || 0,
  }));

  const selectedCartItems = cartItems.filter((item) => item.qty > 0);

  const cartSubtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.pricing.base * item.qty,
    0
  );

  const cartIgst = Number((cartSubtotal * 0.18).toFixed(2));
  const cartTotal = Number((cartSubtotal + cartIgst).toFixed(2));

  const cartSelection: ServiceBreakup[] = cartItems.map((item) => ({
    service: item.service,
    qty: item.qty,
  }));

  const openCartPayment = () => {
    if (selectedCartItems.length === 0) {
      toast.error('Please select at least one service before checkout.');
      return;
    }
    setCheckoutOpen(true);
  };

  const handleModuleClick = async (
    serviceId: string,
    onWalletAvailable: () => void
  ) => {
    try {
      setIsCheckingWallet(true);
      const userId =
        user?.user_id ||
        user?._id ||
        user?.id ||
        user?.data?.user_id ||
        user?.data?._id ||
        '';

      const response = await getWalletBalance(serviceId, userId);

      if (response.data?.is_balance_available) {
        onWalletAvailable();
        return;
      }

      toast.info(`Please add credits to analyze ${serviceId} reports.`);
      // Ensure the service quantity is at least 1 in cart and open checkout modal
      setQuantities((prev) => ({
        ...prev,
        [serviceId]: Math.max(1, prev[serviceId] || 1),
      }));
      setCheckoutOpen(true);
    } catch (error: any) {
      // If error checking wallet, allow proceeding to avoid blocking offline/mock environments
      onWalletAvailable();
    } finally {
      setIsCheckingWallet(false);
    }
  };

  const { data: banks } = useQuery({
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
        skipErrorToast: true,
      });
      return response.data as UploadResponse;
    },
    onSuccess: (data) => {
      const parsed = parseUploadResponse(data.data);
      setUploadResult(parsed);
      setModalStep('confirmation');
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error) || 'Failed to upload bank statement';
      toast.error(msg);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (upload_ref_id: string) => {
      const response = await apiClient.post(
        '/bsa/upload_ref_id',
        { upload_ref_id },
        { skipErrorToast: true }
      );
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message ?? 'Statement confirmed successfully!');
      handleCloseModal();
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error) || 'Failed to confirm statement';
      toast.error(msg);
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

  const handleCloseItrModal = () => {
    setIsItrModalOpen(false);
    setItrEmail('');
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
      const response = await apiClient.get('/itr/link-precheck');
      return response.data;
    },
    enabled: isItrModalOpen,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    const payload = itrPrecheckData?.data;
    if (!payload) {
      setItrState('EMAIL_INPUT');
      return;
    }

    const { itr_reference_id, itr_link_response_code } = payload;
    setItrReferenceId(itr_reference_id ?? null);

    if (!itr_link_response_code) {
      setItrState('EMAIL_INPUT');
      return;
    }

    setItrState(mapResponseCodeToState(itr_link_response_code));
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
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!itrPollingData?.data) return;
    const code = itrPollingData.data.itr_link_response_code;
    setItrState(mapResponseCodeToState(code));

    if (code === 'ENR029') {
      setItrReferenceId(null);
      toast.error('Session not found');
    }
    if (code === 'EBF017' || code === 'EIP018') {
      toast.error('Invalid request');
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
      const refId = data.data?.itr_reference_id;
      if (refId) {
        setItrReferenceId(refId);
        setItrState('AWAITING_CREDENTIAL_SUBMISSION');
      }
      toast.success(
        'Verification email sent successfully. Please check your inbox.'
      );
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
      description: '12 month period for 1 Bank Acc.',
      moduleId: 'BSA',
      price: '₹565',
      icon: <Building2 className="h-6 w-6 text-[#000080]" />,
      onClick: () => {
        handleModuleClick('BSA', () => {
          setModalStep('form');
          setIsModalOpen(true);
        });
      },
      disabled: false,
    },
    {
      title: 'GSTR Analysis',
      description: '12 month period for 1 GST No.',
      moduleId: 'GST',
      price: '₹561',
      icon: <FileText className="h-6 w-6 text-[#000080]" />,
      onClick: () => {
        handleModuleClick('GST', () => {
          navigate('/gst/analysis');
        });
      },
      disabled: false,
    },
    {
      title: 'ITR',
      description: '2 Financial Years for 1 Business',
      moduleId: 'ITR',
      price: '₹525',
      icon: <PieChart className="h-6 w-6 text-[#000080]" />,
      disabled: false,
      onClick: () => {
        handleModuleClick('ITR', () => {
          setIsItrModalOpen(true);
        });
      },
    },
    {
      title: 'KYC',
      description: 'Identity Verification',
      price: 'Included',
      icon: <ShieldCheck className="h-6 w-6 text-[#000080]" />,
      disabled: false,
      onClick: () => {
        setIsKycModalOpen(true);
      },
    },
    {
      title: 'CIBIL Score',
      description: 'Credit Bureau Records till date',
      moduleId: 'CIBIL',
      price: '₹643',
      icon: <CreditCard className="h-6 w-6 text-[#000080]" />,
      disabled: false,
      onClick: () => {
        handleModuleClick('CIBIL', () => {
          navigate('/cibil');
        });
      },
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between px-6 py-4 lg:px-8 lg:py-5 overflow-hidden">
      <div className="flex-1 flex flex-col justify-start min-h-0">
        {/* Header with Title and Help Center */}
        <div className="mb-3 lg:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 border-gray-200 shrink-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#000080]">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Access your financial documents and analysis tools
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/help-center')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-[#000080]/30 text-[#000080] hover:bg-[#000080]/5 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <HelpCircle className="h-4 w-4" />
              Help Center
            </Button>
          </div>
        </div>

        {/* Welcome greeting if available */}
        {companyName && (
          <div className="mb-3 lg:mb-4 flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#000080]/10 border border-[#000080]/20 text-[#000080]">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Welcome back
              </p>
              <h2 className="truncate text-sm sm:text-base font-bold text-[#000080]">
                5PointCredit
              </h2>
            </div>
          </div>
        )}

        {/* Services Grid with Quantity Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-3.5 shrink-0">
          {dashboardItems.map((item, index) => {
            const isHighlighted =
              Boolean(highlightedService) &&
              highlightedService === item.moduleId;

            const shouldBlur =
              Boolean(highlightedService) && !isHighlighted;

            return (
              <Card
                key={index}
                className={`flex flex-col justify-between rounded-xl border bg-white shadow-sm transition-all duration-300 ${item.disabled
                  ? 'opacity-60 cursor-not-allowed bg-gray-50 border-slate-200'
                  : isHighlighted
                    ? 'relative z-20 cursor-pointer scale-[1.02] border-2 border-[#000080] bg-white shadow-[0_0_25px_rgba(0,0,128,0.4)]'
                    : shouldBlur
                      ? 'pointer-events-none cursor-default blur-sm opacity-35 border-slate-200'
                      : 'cursor-pointer border-slate-200 hover:border-[#000080]/40 hover:shadow-md'
                  } ${isCheckingWallet ? 'pointer-events-none opacity-80' : ''}`}
                onClick={!item.disabled ? item.onClick : undefined}
              >
                <CardHeader className="flex flex-row items-center gap-3 p-3.5 pb-1">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${item.disabled ? 'bg-gray-200' : 'bg-blue-50'
                      }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold truncate text-[#000080]">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 text-gray-500 line-clamp-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0">
                  {!item.disabled && (
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#000080] flex items-center gap-1">
                        Click to proceed <span>→</span>
                      </span>

                      {/* Quantity Selector for Cart */}
                      {item.moduleId && (
                        <div
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 shadow-inner"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Decrease ${item.moduleId} quantity`}
                            onClick={() => updateQuantity(item.moduleId!, -1)}
                            disabled={(quantities[item.moduleId] || 0) === 0}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#000080] hover:bg-[#000080]/10 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-4 text-center text-xs font-bold text-slate-800">
                            {quantities[item.moduleId] || 0}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.moduleId} quantity`}
                            onClick={() => updateQuantity(item.moduleId!, 1)}
                            disabled={(quantities[item.moduleId] || 0) === 10}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#000080] hover:bg-[#000080]/10 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout Button Bar */}
        <div className="mt-3 lg:mt-4 flex items-center justify-end shrink-0">
          <Button
            onClick={openCartPayment}
            disabled={selectedCartItems.length === 0}
            className="h-9 sm:h-10 rounded-xl bg-[#002366] hover:bg-[#002366]/90 px-5 text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Go to Checkout
          </Button>
        </div>

        {/* BSA Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-lg shadow-2xl relative animate-scale-in">
              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* STEP 1: Upload Form */}
              {modalStep === 'form' && (
                <>
                  <CardHeader>
                    <CardTitle className="text-2xl text-[#000080] flex items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      Upload Bank Statement
                    </CardTitle>
                    <CardDescription>
                      Upload your bank statement files for automated analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="entityName">
                          Entity / Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="entityName"
                          name="entityName"
                          placeholder="e.g. Acme Enterprises"
                          value={formData.entityName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyType">
                            Company Type <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.companyType}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, companyType: val }))
                            }
                            required
                          >
                            <SelectTrigger id="companyType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Types</SelectLabel>
                                <SelectItem value="Private Limited">
                                  Private Limited
                                </SelectItem>
                                <SelectItem value="Public Limited">
                                  Public Limited
                                </SelectItem>
                                <SelectItem value="Proprietorship">
                                  Proprietorship
                                </SelectItem>
                                <SelectItem value="Partnership">
                                  Partnership
                                </SelectItem>
                                <SelectItem value="LLP">LLP</SelectItem>
                                <SelectItem value="Individual">Individual</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bankCode">
                            Bank <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.bankCode}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, bankCode: val }))
                            }
                            required
                          >
                            <SelectTrigger id="bankCode">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Supported Banks</SelectLabel>
                                {banks?.map((bank) => (
                                  <SelectItem key={bank.code} value={bank.code}>
                                    {bank.bankName}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">
                            Account Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            placeholder="e.g. 1234567890"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accountType">
                            Account Type <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.accountType}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, accountType: val }))
                            }
                            required
                          >
                            <SelectTrigger id="accountType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Account Types</SelectLabel>
                                <SelectItem value="Savings">Savings</SelectItem>
                                <SelectItem value="Current">Current</SelectItem>
                                <SelectItem value="Overdraft">Overdraft</SelectItem>
                                <SelectItem value="Cash Credit">
                                  Cash Credit
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* File Upload Drop Zone */}
                      <div className="space-y-2">
                        <Label>
                          Bank Statement Files (PDF / Excel){' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#000080]/30 rounded-xl cursor-pointer hover:border-[#000080] hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="h-8 w-8 text-[#000080] mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold text-[#000080]">
                                Click to upload
                              </span>{' '}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PDF, XLS, XLSX</p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.xls,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                setSelectedFiles(Array.from(e.target.files));
                              }
                            }}
                          />
                        </label>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500">
                            Selected Files ({selectedFiles.length}):
                          </p>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {selectedFiles.map((f, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg"
                              >
                                <span className="truncate max-w-[280px]">{f.name}</span>
                                <span className="text-gray-400">
                                  {(f.size / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-[#000080] hover:bg-[#000060]"
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            'Upload & Continue'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {/* STEP 2: Confirmation */}
              {modalStep === 'confirmation' && uploadResult && (
                <>
                  <CardHeader>
                    <CardTitle className="text-2xl text-[#000080] flex items-center gap-2">
                      <FileCheck2 className="h-6 w-6 text-green-600" />
                      Verify Statement Period
                    </CardTitle>
                    <CardDescription>
                      Review detected dates before confirming analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {uploadResult.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                            <FileText className="h-4 w-4 text-[#000080]" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          {file.bank_name && (
                            <p className="text-xs text-gray-500">
                              Bank: {file.bank_name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                              From: {file.starting_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                              To: {file.ending_date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setModalStep('form')}
                      >
                        Back
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

        {/* ITR Modal */}
        {isItrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-md shadow-2xl relative animate-scale-in">
              <button
                onClick={handleCloseItrModal}
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
                      Verification email sent successfully.
                    </p>
                    <p className="text-center text-sm text-gray-500 mb-4">
                      Please check your email and complete the verification
                      process.
                    </p>
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
                      onClick={() => {
                        setItrReferenceId(null);
                        setItrEmail('');
                        setItrState('EMAIL_INPUT');
                      }}
                    >
                      Generate New Link
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

        {/* Checkout Payment Modal */}
        <PaymentModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          moduleName="Checkout"
          serviceId="BSA"
          amount={cartTotal}
          servicesBreakup={cartSelection}
          onQuantityChange={updateQuantity}
          onSuccess={() => {
            setCheckoutOpen(false);
            setQuantities({
              BSA: 1,
              GST: 1,
              ITR: 1,
              CIBIL: 1,
            });
            toast.success('Payment completed successfully!');
          }}
        />
      </div>

      {/* Brand Tagline Footer */}
      <div className="flex items-center justify-center gap-3 py-2 text-xs mt-auto pt-2 shrink-0">
        <div className="w-16 h-px bg-blue-300" />
        <span className="text-blue-400 font-mono">///</span>
        <span className="font-semibold text-gray-700">
          Fueling the Future of Lending
        </span>
        <div className="w-px h-4 bg-gray-300" />
        <span className="text-gray-500">
          Engineered in Bengaluru
        </span>
        <span className="text-blue-400 font-mono">///</span>
        <div className="w-16 h-px bg-blue-300" />
      </div>

      {/* Kyc Modal */}
      <KycModal isOpen={isKycModalOpen} onClose={() => setIsKycModalOpen(false)} />
    </div>
  );
}
