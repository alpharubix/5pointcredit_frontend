import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient, { extractErrorMessage } from '@/lib/axios';
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from '@/components/ui/select';
import { UploadCloud, X, Loader2 } from 'lucide-react';

interface Bank {
  bankName: string;
  code: string;
}

const DEFAULT_BANKS: Bank[] = [
  { code: 'AXIS', bankName: 'Axis Bank' },
  { code: 'BANDHAN', bankName: 'Bandhan Bank' },
  { code: 'BOB', bankName: 'Bank of Baroda' },
  { code: 'BOI', bankName: 'Bank of India' },
  { code: 'BOM', bankName: 'Bank of Maharashtra' },
  { code: 'CANARA', bankName: 'Canara Bank' },
  { code: 'CSB', bankName: 'Catholic Syrian Bank' },
  { code: 'CBI', bankName: 'Central Bank of India' },
  { code: 'CITI', bankName: 'Citi Bank' },
  { code: 'CUB', bankName: 'City Union Bank' },
  { code: 'DBS', bankName: 'DBS Bank' },
  { code: 'DCB', bankName: 'DCB Bank' },
  { code: 'DHAN', bankName: 'Dhanlaxmi Bank' },
  { code: 'FEDERAL', bankName: 'Federal Bank' },
  { code: 'HDFC', bankName: 'HDFC Bank' },
  { code: 'ICICI', bankName: 'ICICI Bank' },
  { code: 'IDBI', bankName: 'IDBI Bank' },
  { code: 'IDFC', bankName: 'IDFC FIRST Bank' },
  { code: 'INDIAN', bankName: 'Indian Bank' },
  { code: 'IOB', bankName: 'Indian Overseas Bank' },
  { code: 'INDUS', bankName: 'IndusInd Bank' },
  { code: 'J&K', bankName: 'Jammu & Kashmir Bank' },
  { code: 'KARNATAKA', bankName: 'Karnataka Bank' },
  { code: 'KVB', bankName: 'Karur Vysya Bank' },
  { code: 'KOTAK', bankName: 'Kotak Mahindra Bank' },
  { code: 'LVB', bankName: 'Laxmi Vilas Bank' },
  { code: 'PNB', bankName: 'Punjab & Sind Bank' },
  { code: 'PUNJAB', bankName: 'Punjab National Bank' },
  { code: 'RBL', bankName: 'RBL Bank' },
  { code: 'SBI', bankName: 'State Bank of India' },
  { code: 'SOUTH', bankName: 'South Indian Bank' },
  { code: 'TMB', bankName: 'Tamilnad Mercantile Bank' },
  { code: 'UCO', bankName: 'UCO Bank' },
  { code: 'UNION', bankName: 'Union Bank of India' },
  { code: 'YES', bankName: 'Yes Bank' },
];


interface BsaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  custId?: string;
  onSuccess?: () => void;
}

export default function BsaUploadModal({
  isOpen,
  onClose,
  custId,
  onSuccess,
}: BsaUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    entityName: '',
    companyType: '',
    accountNumber: '',
    accountType: '',
    bankCode: '',
    filePassword: '',
  });

  const { data: banks, isLoading: isLoadingBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await apiClient.get('/bsa/get-bank-names');
      return response.data?.data as Bank[];
    },
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: FormData) => {
      const config = custId ? { params: { cust_id: custId } } : {};
      const response = await apiClient.post('/bsa/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipErrorToast: true,
        ...config,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          'File is under processing we will let you know in the mail once the report got generated'
      );
      handleCloseModal();
      onSuccess?.();
    },
    onError: (error: any) => {
      const msg =
        extractErrorMessage(error) || 'Failed to upload bank statement';
      toast.error(msg);
    },
  });

  const handleCloseModal = () => {
    setSelectedFiles([]);
    setFormData({
      entityName: '',
      companyType: '',
      accountNumber: '',
      accountType: '',
      bankCode: '',
      filePassword: '',
    });
    onClose();
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
      entityName:
        formData.entityName ||
        sessionStorage.getItem('company_name') ||
        '',
      entityType: formData.companyType,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      bankCode: formData.bankCode,
      filePassword: formData.filePassword || undefined,
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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full max-w-[390px] shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto rounded-2xl border-slate-100 p-1">
        <button
          onClick={handleCloseModal}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-[#002366]" />
            Upload Bank Statement
          </CardTitle>
          <CardDescription>
            Provide details and upload your bank statement for analysis
            {custId && (
              <span className="block mt-1 text-[#002366] font-semibold">
                Creating for Customer: {custId}
              </span>
            )}
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
                  <SelectContent style={{ zIndex: 99999 }}>
                    <SelectGroup>
                      <SelectLabel>Company Type</SelectLabel>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Sole_Proprietorship">
                        Sole Proprietorship
                      </SelectItem>
                      <SelectItem value="Trust">Trust</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
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
                  <SelectContent style={{ zIndex: 99999 }}>
                    <SelectGroup>
                      <SelectLabel>Account Type</SelectLabel>
                      <SelectItem value="CURRENT">CURRENT</SelectItem>
                      <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                      <SelectItem value="OVER_DRAFT">Over Draft(OD)</SelectItem>
                      <SelectItem value="CASH_CREDIT">
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
              <Select
                value={formData.bankCode}
                onValueChange={(value) =>
                  setFormData({ ...formData, bankCode: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingBanks ? 'Loading banks...' : 'Select a bank'
                    }
                  />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 99999 }} className="max-h-64 overflow-y-auto">
                  <SelectGroup>
                    <SelectLabel>Available Banks</SelectLabel>
                    {(banks && banks.length > 0 ? banks : DEFAULT_BANKS).map((bank, idx) => (
                      <SelectItem key={idx} value={bank.code}>
                        {bank.bankName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filePassword">
                File Password{' '}
                <span className="text-gray-400 font-normal text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                id="filePassword"
                name="filePassword"
                type="password"
                placeholder="Enter password if statement is protected"
                value={formData.filePassword}
                onChange={handleInputChange}
              />
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
                      setSelectedFiles((prev) => [...prev, ...newFiles]);
                      e.target.value = '';
                    }
                  }}
                  className="cursor-pointer file:cursor-pointer file:bg-[#eff6ff] file:text-[#002366] file:font-semibold file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-blue-100 transition-all"
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
              className="w-full bg-[#002366] hover:bg-[#001744] text-white shadow-sm shadow-[#002366]/20 mt-6 cursor-pointer"
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
      </Card>
    </motion.div>,
    document.body
  );
}
