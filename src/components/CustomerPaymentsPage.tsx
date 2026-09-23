import { useQuery } from "@tanstack/react-query";
import { getWalletBalance } from "../api/payment";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, FileText, PieChart, ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomerPaymentsPage() {
  const { user } = useAuthContext();

  const { data: walletBalances, isLoading } = useQuery({
    queryKey: ["payments-dashboard-data", user],
    queryFn: async () => {
      try {
        const userId = user?.user_id || user?._id || user?.id || (user as any)?.data?.user_id || (user as any)?.data?._id || "";
        const [
          bsaWallet,
          gstWallet,
          cibilWallet,
          itrWallet
        ] = await Promise.allSettled([
          getWalletBalance("BSA", userId),
          getWalletBalance("GST", userId),
          getWalletBalance("CIBIL", userId),
          getWalletBalance("ITR", userId),
        ]);

        const walletMap: Record<string, { available_balance: number; is_balance_available: boolean }> = {};
        const walletResults = [
          { service: "BSA", res: bsaWallet },
          { service: "GST", res: gstWallet },
          { service: "CIBIL", res: cibilWallet },
          { service: "ITR", res: itrWallet },
        ];

        walletResults.forEach(({ service, res }) => {
          if (res.status === "fulfilled" && res.value?.data) {
            walletMap[service] = {
              available_balance: res.value.data.available_balance ?? 0,
              is_balance_available: !!res.value.data.is_balance_available,
            };
          } else {
            walletMap[service] = {
              available_balance: 0,
              is_balance_available: false,
            };
          }
        });

        return walletMap;
      } catch (err) {
        console.error("Error fetching wallet balances:", err);
        return {};
      }
    },
    retry: false,
  });

  const handleCheckWalletBalance = async (service: string) => {
    const wallet = walletBalances?.[service];
    if (wallet) {
      if (wallet.is_balance_available) {
        toast.success(`${service} Balance Available: ₹${wallet.available_balance}`);
      } else {
        toast.error(`Insufficient ${service} Balance: ₹${wallet.available_balance}`);
      }
      return;
    }

    try {
      const toastId = toast.loading(`Checking wallet balance for ${service}...`);
      const userId = user?.user_id || user?._id || user?.id || (user as any)?.data?.user_id || (user as any)?.data?._id || "";

      const res = await getWalletBalance(service, userId);
      toast.dismiss(toastId);

      if (res.data?.is_balance_available) {
        toast.success(`${service} Balance Available: ₹${res.data.available_balance}`);
      } else {
        toast.error(`Insufficient ${service} Balance: ₹${res.data?.available_balance || 0}`);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Failed to check ${service} wallet balance.`);
      console.error(err);
    }
  };

  const modules = [
    { id: "BSA", label: "BSA", icon: Building2 },
    { id: "GST", label: "GST", icon: FileText },
    { id: "CIBIL", label: "CIBIL", icon: ShieldCheck },
    { id: "ITR", label: "ITR", icon: PieChart },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#002366]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#008] flex items-center gap-3">
          Payments Dashboard
        </h1>
        <p className="mt-2 text-gray-500">
          Check your module balances.
        </p>
      </div>

      {/* Module Wallet Checkers */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Wallet Balances</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((mod) => {
            const wallet = walletBalances?.[mod.id];
            return (
              <button
                key={mod.id}
                onClick={() => handleCheckWalletBalance(mod.id)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-[#002366] hover:shadow-lg transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-[#002366]/10 transition-colors">
                  <mod.icon className="h-6 w-6 text-slate-500 group-hover:text-[#002366]" />
                </div>
                <span className="font-semibold text-slate-700">{mod.label}</span>
                <span className={`text-sm font-bold mt-1.5 ${wallet?.is_balance_available ? "text-emerald-600" : "text-slate-500"}`}>
                  {wallet !== undefined ? `₹${wallet.available_balance.toLocaleString("en-IN")}` : "₹0"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

