import { useState } from "react";
import apiClient from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";

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

function parseUploadResponse(raw: UploadResponse["data"]): ParsedUploadResult {
  const { upload_ref_id, ...fileEntries } = raw;
  const files = Object.entries(fileEntries).map(([name, info]) => ({
    name,
    starting_date: (info as UploadFileInfo).starting_date,
    ending_date: (info as UploadFileInfo).ending_date,
  }));
  return { upload_ref_id, files };
}

type ModalStep = "form" | "confirmation";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<ParsedUploadResult | null>(null);

  const [formData, setFormData] = useState({
    entityName: "",
    companyType: "",
    accountNumber: "",
    accountType: "",
    bankCode: "",
  });

  const { data: banks, isLoading: isLoadingBanks } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await apiClient.get("/bsa/get-bank-names");
      return response.data?.data as Bank[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: FormData) => {
      const response = await apiClient.post("/bsa/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data as UploadResponse;
    },
    onSuccess: (data) => {
      const parsed = parseUploadResponse(data.data);
      setUploadResult(parsed);
      setModalStep("confirmation");
    },
    onError: (error: any) => {
      toast.error(`${error.message}`);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (upload_ref_id: string) => {
      const response = await apiClient.post("/bsa/upload_ref_id", { upload_ref_id });
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message ?? "Statement confirmed successfully!");
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(`${error.message}`);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStep("form");
    setUploadResult(null);
    setSelectedFiles([]);
    setFormData({
      entityName: "",
      companyType: "",
      accountNumber: "",
      accountType: "",
      bankCode: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    if (!formData.bankCode) {
      toast.error("Please select a bank");
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
    formPayload.append("data", jsonString);
    selectedFiles.forEach((file) => {
      formPayload.append("files", file);
    });

    uploadMutation.mutate(formPayload);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const dashboardItems = [
    {
      title: "Bank Statement analyze",
      description: "Upload & Analyze",
      icon: <Building2 className="h-8 w-8 text-[#000080]" />,
      onClick: () => {
        setModalStep("form");
        setIsModalOpen(true);
      },
      disabled: false,
    },
    {
      title: "GSTR-3b",
      description: "GST Return Document",
      icon: <FileText className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
    {
      title: "ITR",
      description: "Income Tax Return",
      icon: <PieChart className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
    {
      title: "CIBIL Score",
      description: "Credit Report",
      icon: <CreditCard className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
    {
      title: "KYC",
      description: "Identity Verification",
      icon: <ShieldCheck className="h-8 w-8 text-[#000080]" />,
      disabled: true,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in relative min-h-[calc(100vh-4rem)]">
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
            className={`transition-all duration-300 ${item.disabled
              ? "opacity-60 cursor-not-allowed bg-gray-50"
              : "hover:shadow-xl hover:-translate-y-1 cursor-pointer border-[#000080]/20 hover:border-[#000080]/50 bg-white"
              }`}
            onClick={!item.disabled ? item.onClick : undefined}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div
                className={`p-3 rounded-xl ${item.disabled ? "bg-gray-200" : "bg-blue-50"}`}
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
            {modalStep === "form" && (
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
                              <SelectItem value="Individual">Individual</SelectItem>
                              <SelectItem value="Company">Company</SelectItem>
                              <SelectItem value="Sole Proprietorship">
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
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Account Type</SelectLabel>
                              <SelectItem value="CURRENT">CURRENT</SelectItem>
                              <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                              <SelectItem value="Over Draft(OD)">Over Draft(OD)</SelectItem>
                              <SelectItem value="Cash Credit(CC)">Cash Credit(CC)</SelectItem>
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
                      <Label htmlFor="file">Statement Files <span className="text-red-500">*</span></Label>
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
                              e.target.value = ''; // Reset input to allow selecting the same file again if removed
                            }
                          }}
                          className="cursor-pointer file:cursor-pointer file:bg-[#000080]/5 file:text-[#000080] file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-[#000080]/10 transition-all"
                        />
                        
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-blue-50/30">
                                <span className="text-sm text-gray-700 truncate mr-2" title={file.name}>{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
                        "Upload & Analyze"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {/* ── STEP 2: Confirmation ── */}
            {modalStep === "confirmation" && uploadResult && (
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
                          <span className="font-medium text-gray-500">From:</span>
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
                      onClick={() => setModalStep("form")}
                      disabled={confirmMutation.isPending}
                    >
                      ← Go Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-[#000080] hover:bg-[#000060]"
                      onClick={() => confirmMutation.mutate(uploadResult.upload_ref_id)}
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
    </div>
  );
}