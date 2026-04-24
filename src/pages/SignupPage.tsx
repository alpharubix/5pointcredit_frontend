import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerSchema, type RegisterFormValues } from "@/lib/zod-schemas";
import { useRegister, getApiError } from "@/hooks/useAuth";
import FivePointCreditWhiteLogo from "../assets/5PontCreditWhiteLogo.svg";
import FivePointCreditBlackLogo from "../assets/5PontCreditBlackLogo.svg";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  {
    label: "Contains uppercase letter",
    test: (p: string) => /[A-Z]/.test(p),
  },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  {
    label: "Contains a special character",
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const passwordStrength = passwordRules.filter((r) =>
    r.test(passwordValue)
  ).length;

  const onSubmit = (values: RegisterFormValues) => {
    const { confirm_password: _, ...payload } = values;
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#000080] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/[0.03] border border-white/10" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="float-animation mb-8 inline-flex">
            <div className="flex h-40 w-40 items-center justify-center">
              <img src={FivePointCreditWhiteLogo} alt="5PointCredit logo" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            5PointCredit
            <br />
            <span className="text-white/70">Create your account</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Create your account and start uploading documents.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: "ROI", label: "8.25% Onwards" },
              { value: "Approvals in", label: "72 hrs" },
              { value: "Lenders", label: "175+ Banks & NBFC's" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 p-3 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6 overflow-y-auto">
        <div className="w-full max-w-md  animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-24 w-24 items-center justify-center">
              <img src={FivePointCreditBlackLogo} alt="5PointCredit logo" />
            </div>
          </div>

          <Card className="shadow-2xl border-0 ring-1 ring-[#000080]/10">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-3xl">Create Account</CardTitle>
              <CardDescription className="text-base">
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                id="signup-form"
              >
                {/* API Error */}
                {registerMutation.isError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-fade-in">
                    {getApiError(registerMutation.error)}
                  </div>
                )}

                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className={`pl-10 ${errors.customer_name ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="name"
                      {...register("customer_name")}
                    />
                  </div>
                  {errors.customer_name && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.customer_name.message}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-company"
                      type="text"
                      placeholder="Acme Enterprises"
                      className={`pl-10 ${errors.company_name ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="organization"
                      {...register("company_name")}
                    />
                  </div>
                  {errors.company_name && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.company_name.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="8104106108"
                      maxLength={10}
                      className={`pl-10 ${errors.phone_no ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="tel"
                      {...register("phone_no")}
                    />
                  </div>
                  {errors.phone_no && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.phone_no.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@example.com"
                      className={`pl-10 ${errors.email_id ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="email"
                      {...register("email_id")}
                    />
                  </div>
                  {errors.email_id && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.email_id.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-10 pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000080]/40 hover:text-[#000080] transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.password.message}
                    </p>
                  )}

                  {/* Password Strength */}
                  {passwordValue && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex gap-1.5 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength >= i
                                ? passwordStrength <= 1
                                  ? "bg-red-400"
                                  : passwordStrength === 2
                                    ? "bg-orange-400"
                                    : passwordStrength === 3
                                      ? "bg-yellow-400"
                                      : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.label}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Check
                              className={`h-3 w-3 ${
                                rule.test(passwordValue)
                                  ? "text-green-500"
                                  : "text-gray-300"
                              }`}
                            />
                            <span
                              className={
                                rule.test(passwordValue)
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-10 ${errors.confirm_password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="new-password"
                      {...register("confirm_password")}
                    />
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-500 animate-fade-in">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base gap-2"
                  disabled={registerMutation.isPending}
                  id="signup-submit"
                >
                  {registerMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#000080] hover:underline"
                    id="goto-login"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
