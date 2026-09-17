import { useState, useEffect } from 'react';
import { createPaymentOrder, validatePayment } from '@/api/payment';
import type { ServiceBreakup } from '@/api/payment';
import {
  Loader2,
  X,
  Wallet,
  CheckCircle2,
  Minus,
  Plus,
  Send,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { logoBase64 } from '@/assets/logoBase64';
import { useAuthContext } from '@/contexts/AuthContext';
import { getPricingDetails } from '@/lib/paymentUtils';



interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  serviceId: string;
  amount: number;
  custId?: string;
  servicesBreakup?: ServiceBreakup[];
  onQuantityChange?: (service: string, change: number) => void;
  onSuccess: () => void;
  requestFromAnchor?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  moduleName,
  serviceId,
  amount,
  custId,
  servicesBreakup,
  onQuantityChange,
  onSuccess,
  requestFromAnchor = false,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingToCustomer, setIsSendingToCustomer] = useState(false);
  const { user } = useAuthContext() as any;

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    } else {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const getFeatures = (module: string) => {
    switch (module.toUpperCase()) {
      case 'BSA':
        return [
          'Comprehensive Transaction Analysis',
          'Monthly Inflow & Outflow Trends',
          'Cash Flow Statements & Summaries',
          'Debit/Credit Ratios & Patterns',
          'Bounced Cheques & Overdrafts Identification',
        ];

      case 'GST':
        return [
          'GSTR-1 & GSTR-3B Return Status',
          'Sales and Purchase Analysis',
          'Tax Liability & ITC Computations',
          'Delay/Filing Compliance Tracking',
          'Monthly Trend Analysis',
        ];

      case 'ITR':
        return [
          'Detailed Income & Deductions Breakdown',
          'Profit & Loss Statement Extraction',
          'Balance Sheet & Asset/Liability Tracking',
          'Liquidity & Solvency Ratio Analysis',
          'Tax Paid & Refund History',
        ];

      case 'CIBIL':
        return [
          'Complete Credit Score & Bureau Report',
          'Overdue Accounts & DPD Tracking',
          'Active vs Closed Loan Account Details',
          'Recent Credit Enquiries & History',
          'Default & Delinquency Flags',
        ];

      default:
        return [
          'Comprehensive Data Analysis',
          'Detailed Financial Insights',
          'Customized Reporting & Visualizations',
          'Exportable PDF/Excel Formats',
        ];
    }
  };

  const pricing = getPricingDetails(moduleName, amount);

  const serviceLabels: Record<string, string> = {
    BSA: 'Bank Statement Analysis',
    GST: 'Goods & Services Tax',
    ITR: 'Income Tax Returns',
    CIBIL: 'CIBIL Credit Report',
  };

  const servicePeriods: Record<string, string> = {
    BSA: '(12 month period for 1 Bank Acc.)',
    GST: '(12 month period for 1 GST No.)',
    ITR: '(2 Financial Years for 1 Business)',
    CIBIL: '(Credit Bureau Records till date)',
  };

  const cartLines = (servicesBreakup || []).map((item) => {
    const itemPricing = getPricingDetails(item.service, 0);

    return {
      ...item,
      ...itemPricing,
      label: serviceLabels[item.service] || item.service,
      periodLabel: servicePeriods[item.service] || '',
      lineAmount: itemPricing.base * item.qty,
      lineTotal: itemPricing.total * item.qty,
    };
  });

  const isCartPayment = servicesBreakup !== undefined;

  const hasSelectedServices = cartLines.some(
    (item) => item.qty > 0
  );

  const cartSubtotal = cartLines.reduce(
    (sum, item) => sum + item.lineAmount,
    0
  );

  const cartIgst = Number(
    (cartSubtotal * 0.18).toFixed(2)
  );

  const cartGrandTotal = Number(
    (cartSubtotal + cartIgst).toFixed(2)
  );

  const payableAmount = isCartPayment
    ? cartGrandTotal
    : amount;

  const periodFeature =
    pricing.period !== 'N/A'
      ? pricing.period === 'Latest Report'
        ? 'Latest Report'
        : `${pricing.period} Analysis`
      : null;

  const baseFeatures = getFeatures(moduleName);

  const features = periodFeature
    ? [periodFeature, ...baseFeatures]
    : baseFeatures;

  const handlePay = async () => {
    try {
      setIsProcessing(true);

      const razorpayKey =
        import.meta.env.VITE_RAZOR_PAY_KEY_ID ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        toast.error(
          'Razorpay live key is not configured. Please contact system administration.'
        );

        setIsProcessing(false);
        return;
      }

      const resolvedUserId =
        custId ||
        localStorage.getItem('selected_cust_id') ||
        user?._id ||
        user?.id ||
        user?.data?.user_id ||
        user?.data?._id ||
        localStorage.getItem('user_id');

      const orderPayload = {
        service: serviceId,

        services_breakup: servicesBreakup
          ? servicesBreakup.filter((item) => item.qty > 0)
          : [{ service: serviceId, qty: 1 }],

        amount: payableAmount,

        currency: 'INR',
      } as Parameters<typeof createPaymentOrder>[0];

      if (custId && resolvedUserId) {
        orderPayload.user_id = resolvedUserId;
        orderPayload.userId = resolvedUserId;
      }

      const orderRes =
        await createPaymentOrder(orderPayload);

      const orderData = orderRes.data;

      const options = {
        key: razorpayKey,

        amount: orderData.amount,

        currency: orderData.currency,

        name: '5PointCredit',

        description: `Payment for ${moduleName} report`,

        image: logoBase64,

        order_id: orderData.order_id,

        handler: async function (response: any) {
          try {
            const validationPayload = {
              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_signature:
                response.razorpay_signature,
            } as Parameters<typeof validatePayment>[0];

            if (custId && resolvedUserId) {
              validationPayload.user_id = resolvedUserId;
              validationPayload.userId = resolvedUserId;
            }

            await validatePayment(validationPayload);

            toast.success(
              `${moduleName} successfully unlocked!`
            );

            setIsProcessing(false);

            onClose();

            onSuccess();
          } catch (err) {
            toast.error(
              'Payment validation failed. Please contact support.'
            );
          } finally {
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setIsProcessing(false);

            toast.info('Payment cancelled.');
          },
        },

        theme: {
          color: '#002366',
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.open();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        'Failed to initiate payment.'
      );

      setIsProcessing(false);
    }
  };

  const handleSendToCustomer = async () => {
    try {
      setIsSendingToCustomer(true);

      const resolvedUserId =
        custId ||
        localStorage.getItem('selected_cust_id') ||
        user?._id ||
        user?.id ||
        user?.data?.user_id ||
        user?.data?._id ||
        localStorage.getItem('user_id');

      const orderPayload = {
        service: serviceId,
        services_breakup: servicesBreakup
          ? servicesBreakup.filter((item) => item.qty > 0)
          : [{ service: serviceId, qty: 1 }],
        amount: payableAmount,
        currency: 'INR',
      } as Parameters<typeof createPaymentOrder>[0];

      if (custId && resolvedUserId) {
        orderPayload.user_id = resolvedUserId;
        orderPayload.userId = resolvedUserId;
      }

      await createPaymentOrder(orderPayload);

      toast.success(
        'Payment request sent! The customer can now pay from their dashboard.'
      );

      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        'Failed to send payment request to customer.'
      );
    } finally {
      setIsSendingToCustomer(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && onClose()}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              className={`relative z-10 flex min-h-[600px] max-h-[95vh] h-auto w-full ${isCartPayment
                ? 'max-w-2xl'
                : 'max-w-md'
                } flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
            >
              {/* Header */}
              <div className="relative shrink-0 bg-[#002366] p-6 pb-2 text-white">
                <div
                  className="absolute right-4 top-4 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                  onClick={() =>
                    !isProcessing && onClose()
                  }
                >
                  <X className="h-5 w-5 hover:text-red-500" />
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {moduleName} Payment
                  </h2>
                </div>

                <div>
                  <p className="mt-1 text-sm font-medium text-blue-100">
                    Unlock access to generate this report.
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className=" relative min-h-0 flex-1 overflow-y-auto bg-white p-6 pb-6 pt-4">
                <div className="mb-6 w-full">
                  {isCartPayment ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      {/* Table Header */}
                      <div className="grid grid-cols-[28px_minmax(0,1fr)_76px_62px_80px] gap-2 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        <span>Sl</span>

                        <span>Description</span>

                        <span className="-ml-5">
                          Qty
                        </span>

                        <span>Rate</span>

                        <span className="text-right">
                          Amount
                        </span>
                      </div>

                      {/* Cart Lines */}
                      {cartLines
                        .filter(
                          (line) => line.qty > 0
                        )
                        .map((line, index) => (
                          <div
                            key={line.service}
                            className="grid grid-cols-[28px_minmax(0,1fr)_76px_62px_80px] gap-2 border-t border-slate-100 px-3 py-3 text-xs text-slate-700"
                          >
                            <span>
                              {index + 1}
                            </span>

                            <span className="flex min-w-0 flex-col font-medium">
                              <span>
                                {line.label}
                              </span>

                              <span className="text-[10px] font-normal leading-tight text-slate-500">
                                {line.periodLabel}
                              </span>
                            </span>

                            <span className="-ml-10 flex items-center gap-1 whitespace-nowrap">
                              {onQuantityChange && (
                                <button
                                  type="button"
                                  aria-label={`Decrease ${line.service} quantity`}
                                  onClick={() =>
                                    onQuantityChange(
                                      line.service,
                                      -1
                                    )
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 text-[#002366] hover:bg-slate-50"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              )}

                              <span className="min-w-4 text-center">
                                {line.qty}
                              </span>

                              {onQuantityChange && (
                                <button
                                  type="button"
                                  aria-label={`Increase ${line.service} quantity`}
                                  onClick={() =>
                                    onQuantityChange(
                                      line.service,
                                      1
                                    )
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 text-[#002366] hover:bg-slate-50"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </span>

                            <span>
                              ₹{line.base}
                            </span>

                            <span className="text-right font-semibold">
                              ₹{line.lineAmount}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
                        What's Included
                      </h3>

                      <ul className="space-y-2.5">
                        {features.map(
                          (feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#002366]" />

                              <span className="text-sm font-medium leading-tight text-slate-600">
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}
                </div>

                {/* Cart Payment Summary */}
                {isCartPayment && (
                  <div className="mb-6 w-full space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">
                        Subtotal
                      </span>

                      <span className="font-semibold text-slate-700">
                        ₹{cartSubtotal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">
                        IGST (18%)
                      </span>

                      <span className="font-semibold text-slate-700">
                        ₹{cartIgst}
                      </span>
                    </div>

                    <div className="my-1 h-px w-full bg-slate-200" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
                        Grand Total
                      </span>

                      <span className="text-xl font-black text-[#002366]">
                        ₹{Math.floor(cartGrandTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Single Service Payment Summary */}
                {!isCartPayment && (
                  <div className="mb-6 w-full space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">
                        Service Amount
                      </span>

                      <span className="font-semibold text-slate-700">
                        ₹{pricing.base}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">
                        GST (18%)
                      </span>

                      <span className="font-semibold text-slate-700">
                        ₹{pricing.gst}
                      </span>
                    </div>

                    <div className="my-1 h-px w-full bg-slate-200" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
                        Total Amount
                      </span>

                      <span className="text-xl font-black text-[#002366]">
                        ₹{pricing.total}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Button(s) */}
                <div className="relative w-full bg-white pt-1">
                  {requestFromAnchor ? (
                    <div className="flex gap-3">
                      {/* Option 1 — I Will Pay (Razorpay) */}
                      <Button
                        onClick={handlePay}
                        disabled={
                          isProcessing ||
                          isSendingToCustomer ||
                          (isCartPayment && !hasSelectedServices)
                        }
                        className="flex-1 h-12 cursor-pointer rounded-xl bg-[#002366] text-sm font-bold text-white shadow-sm shadow-[#002366]/20 hover:bg-[#002366]/80 flex items-center justify-center gap-2 transition-all"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            I Will Pay
                          </>
                        )}
                      </Button>

                      {/* Option 2 — Send to Customer (pending order) */}
                      <Button
                        onClick={handleSendToCustomer}
                        disabled={
                          isSendingToCustomer ||
                          isProcessing ||
                          (isCartPayment && !hasSelectedServices)
                        }
                        className="flex-1 h-12 cursor-pointer rounded-xl border-2 border-[#002366] bg-white text-sm font-bold text-[#002366] shadow-sm hover:bg-[#002366]/5 flex items-center justify-center gap-2 transition-all"
                      >
                        {isSendingToCustomer ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send to Customer
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handlePay}
                      disabled={
                        isProcessing ||
                        (isCartPayment && !hasSelectedServices)
                      }
                      className="h-12 w-full cursor-pointer rounded-xl bg-[#002366] text-base font-bold text-white shadow-sm shadow-[#002366]/20 hover:border-2 hover:border-[#002366] hover:bg-[#002366]/80"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ₹${Math.floor(payableAmount)}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}