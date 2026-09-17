import { cloneElement, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getWalletBalance } from "@/api/payment";
import fivePointCreditLogo from "@/assets/5PontCreditBlackLogo.svg";
import { useNavigate } from "react-router-dom";

interface WalletProtectedComponentProps {
  service: string;
  children: ReactNode;
}

export default function WalletProtectedComponent({
  service,
  children,
}: WalletProtectedComponentProps) {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Reset redirect ref if service changes
  useEffect(() => {
    hasRedirected.current = false;
    setIsRedirecting(false);
  }, [service]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallet-access", service],
    queryFn: () => getWalletBalance(service),
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (
      !isLoading &&
      (isError || !data?.data?.is_balance_available) &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      setIsRedirecting(true);

      const timer = setTimeout(() => {
        navigate(`/home/dashboard`, {
          replace: true,
          state: { highlight: service, t: Date.now() },
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    isError,
    data?.data?.is_balance_available,
    service,
    navigate,
  ]);

  if (isLoading || isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src={fivePointCreditLogo}
            alt="5PointCredit"
            className="h-28 w-auto"
          />
        </div>

        {/* Message */}
        <h1 className="rounded-lg p-5 text-center text-xl font-semibold text-gray-700">
          Insufficient credits to analyze the {service} reports.
          Please add credits to continue.
        </h1>

        <p className="mt-2 text-md text-gray-500">
          Redirecting to payment page...
        </p>

        <Loader2 className="mt-4 h-6 w-6 animate-spin text-[#000080]" />
      </div>
    );
  }

  const child = children as ReactElement<{
    isBalanceAvailable?: boolean;
  }>;

  return cloneElement(child, {
    isBalanceAvailable: data?.data?.is_balance_available ?? false,
  });
}