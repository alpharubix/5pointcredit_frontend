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
import { FileText, Building2, CreditCard, PieChart, ShieldCheck, UploadCloud, X } from "lucide-react";

interface Bank {
  srNo: number;
  bankName: string;
  code: string;
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


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
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.info(`${data.message}`);
      setIsModalOpen(false);
      setFormData({
        entityName: "",
        companyType: "",
        accountNumber: "",
        accountType: "",
        bankCode: "",
      });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(`${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload");
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
    formPayload.append("files", selectedFile);

    uploadMutation.mutate(formPayload);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const dashboardItems = [
    {
      title: "Bank Statement analyze",
      description: "Upload & Analyze",
      icon: <Building2 className="h-8 w-8 text-[#000080]" />,
      onClick: () => setIsModalOpen(true),
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
        <p className="text-gray-600">Access your financial documents and analysis tools</p>
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
              <div className={`p-3 rounded-xl ${item.disabled ? "bg-gray-200" : "bg-blue-50"}`}>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
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
                    <Label htmlFor="companyType">Company Type <span className="text-red-500">*</span></Label>
                    <select
                      id="companyType"
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Individual">Individual</option>
                      <option value="Company">Company</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Trust">Trust</option>
                      <option value="Partnership">Partnership</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type <span className="text-red-500">*</span></Label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Select</option>
                      <option value="CURRENT">CURRENT</option>
                      <option value="SAVINGS">SAVINGS</option>
                      <option value="Over Draft(OD)">Over Draft(OD)</option>
                      <option value="Cash Credit(CC)">Cash Credit(CC)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number <span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="bankCode">Select Bank <span className="text-red-500">*</span></Label>
                  <select
                    id="bankCode"
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="" disabled>Select a bank</option>
                    {isLoadingBanks ? (
                      <option disabled>Loading banks...</option>
                    ) : (
                      banks?.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.bankName} ({bank.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Statement File</Label>
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      id="file"
                      type="file"
                      multiple={true}
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                      className="cursor-pointer file:cursor-pointer file:bg-[#000080]/5 file:text-[#000080] file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-[#000080]/10 transition-all"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        (document.getElementById('file') as HTMLInputElement).value = '';
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#000080] hover:bg-[#000060] mt-6"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
