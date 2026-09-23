import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPendingPayments,
  validatePayment,
  getWalletBalance,
  type PendingPayment,
} from "../api/payment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { CreditCard, Loader2, IndianRupee, ArrowRight, FileText, PieChart, ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";
import fivePointCreditLogo from "@/assets/5PontCreditWhiteLogo.svg";

export default function CustomerPaymentsPage() {
  const { user } = useAuthContext();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pageData, isLoading, refetch } = useQuery({
    queryKey: ["payments-dashboard-data", user],
    queryFn: async () => {
      try {
        const userId = user?.user_id || user?._id || user?.id || (user as any)?.data?.user_id || (user as any)?.data?._id || "";
        const [
          bsaPending,
          gstPending,
          itrPending,
          cibilPending,
          bsaWallet,
          gstWallet,
          cibilWallet,
          itrWallet
        ] = await Promise.allSettled([
          getPendingPayments("BSA", userId),
          getPendingPayments("GST", userId),
          getPendingPayments("ITR", userId),
          getPendingPayments("CIBIL", userId),
          getWalletBalance("BSA", userId),
          getWalletBalance("GST", userId),
          getWalletBalance("CIBIL", userId),
          getWalletBalance("ITR", userId),
        ]);

        const combinedOrders: PendingPayment[] = [];
        [bsaPending, gstPending, itrPending, cibilPending].forEach((res) => {
          if (res.status === "fulfilled" && res.value) {
            const val = res.value;
            if (val.data && typeof val.data === "object") {
              if ("pending_order" in val.data && val.data.pending_order) {
                combinedOrders.push(val.data.pending_order);
              } else if (Array.isArray(val.data)) {
                combinedOrders.push(...val.data);
              }
            } else if (Array.isArray(val)) {
              combinedOrders.push(...val);
            }
          }
        });

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

        return {
          pendingPayments: combinedOrders,
          walletBalances: walletMap,
        };
      } catch (err) {
        console.error("Error fetching payments dashboard data:", err);
        return { pendingPayments: [], walletBalances: {} };
      }
    },
    retry: false,
  });

  const pendingPayments = pageData?.pendingPayments || [];
  const walletBalances = pageData?.walletBalances || {};

  const handleCheckWalletBalance = async (service: string) => {
    const wallet = walletBalances[service];
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

  const handlePay = async (payment: PendingPayment) => {
    try {
      setProcessingId(payment.id);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(payment.amount * 100),
        currency: payment.currency || "INR",
        name: "5PointCredit",
        description: `Payment for ${payment.service} report`,
        image: window.location.origin + fivePointCreditLogo,
        order_id: payment.id,
        handler: async function (response: any) {
          try {
            await validatePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: ((user as any)?._id || (user as any)?.id) as string | undefined,
              userId: ((user as any)?._id || (user as any)?.id) as string | undefined,
            });

            toast.success("Payment successful!");
            refetch();
          } catch (err: any) {
            console.error("Payment verification failed", err);
            toast.error(err.response?.data?.detail || "Payment verification failed");
          } finally {
            setProcessingId(null);
          }
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email_id || "customer@example.com",
          contact: user?.mobile_number || "9999999999"
        },
        theme: {
          color: "#002366"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessingId(null);
      });

      // Handle modal close without success/failure
      razorpay.on('payment.modal.closed', function () {
        setProcessingId(null);
      });

      razorpay.open();
    } catch (err: any) {
      console.error("Payment initiation failed", err);
      toast.error(err.response?.data?.detail || "Failed to initiate payment");
      setProcessingId(null);
    }
  };

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
          Check your module balances and complete pending payments.
        </p>
      </div>

      {/* Module Wallet Checkers */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Wallet Balances</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((mod) => {
            const wallet = walletBalances[mod.id];
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

      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Pending Orders</h2>
        {pendingPayments.length === 0 ? (
          <Card className="border-0 shadow-sm bg-slate-50 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-blue-50 text-[#002366] rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Pending Payments</h3>
              <p className="text-gray-500 max-w-md mt-2">
                You're all caught up! There are no pending payments requiring your attention at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPayments.map((payment) => (
              <Card key={payment.id || payment._id} className="overflow-hidden border-0 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#002366]/5 transition-all group">
                <div className="h-2 bg-[#002366]" />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs font-bold text-[#002366] uppercase tracking-wider mb-1">
                        {payment.service} REPORT
                      </div>
                      <div className="text-xs font-semibold text-[#002366] bg-[#002366]/10 px-2 py-1 rounded-full w-fit mt-2">
                        1 Year Analysis
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#002366]/10 transition-colors">
                      <IndianRupee className="h-5 w-5 text-gray-700 group-hover:text-[#002366]" />
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-gray-900">₹{(payment.amount / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <Button
                      onClick={() => handlePay(payment)}
                      disabled={processingId !== null}
                      className="w-full h-11 bg-[#002366] hover:bg-[#3f32a3]/80 hover:tracking-[0.05em] text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === payment.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay Now
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
