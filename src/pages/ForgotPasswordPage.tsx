import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
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
import {
  forgotPasswordSchema,
  validateOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ValidateOtpFormValues,
  type ResetPasswordFormValues,
} from "@/lib/zod-schemas";
import {
  useForgotPassword,
  useValidateOtp,
  useResetPassword,
  getApiError,
} from "@/hooks/useAuth";
import FivePointCreditWhiteLogo from "../assets/5PontCreditWhiteLogo.svg";
import FivePointCreditBlackLogo from "../assets/5PontCreditBlackLogo.svg";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  {
    label: "Contains a special character",
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
];

type Step = "email" | "otp" | "reset";

const STEP_META: Record<Step, { title: string; description: string; step: number }> = {
  email: {
    step: 1,
    title: "Forgot Password",
    description: "Enter your registered email and we'll send you an OTP.",
  },
  otp: {
    step: 2,
    title: "Verify OTP",
    description: "Enter the 4-digit OTP sent to your email address.",
  },
  reset: {
    step: 3,
    title: "Reset Password",
    description: "Create a new strong password for your account.",
  },
};

// ─── Step 1: Email ────────────────────────────────────────────────────────────
function EmailStep({
  onSuccess,
}: {
  onSuccess: (email: string, message: string) => void;
}) {  
  const mutation = useForgotPassword();

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<ForgotPasswordFormValues>({
  resolver: zodResolver(forgotPasswordSchema),
});

  const onSubmit = (values: ForgotPasswordFormValues) => {
  mutation.mutate(values, {
    onSuccess: (data: any) => {
      console.log(data);

      onSuccess(values.email_id, data?.message ?? "");
    },
  });
};
  return (
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="forgot-email-form">

  {/* {mutation.data?.message && (
    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 animate-fade-in">
      {mutation.data.message}
    </div>
  )} */}

  {mutation.isError && (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      {getApiError(mutation.error)}
    </div>
  )}

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
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

      <Button
        type="submit"
        className="w-full h-12 text-base gap-2"
        disabled={mutation.isPending}
        id="forgot-email-submit"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Sending OTP...
          </>
        ) : (
          <>
            Send OTP
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-[#000080] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}

// ─── Step 2: OTP ─────────────────────────────────────────────────────────────
function OtpStep({
  email,
  apiMessage,
  onSuccess,
  onBack,
}: {
  email: string;
  apiMessage: string;
  onSuccess: (resetToken: string) => void;
  onBack: () => void;
}) {
  const mutation = useValidateOtp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidateOtpFormValues>({
    resolver: zodResolver(validateOtpSchema),
  });

  const onSubmit = (values: ValidateOtpFormValues) => {
    mutation.mutate(
      { email_id: email, otp: values.otp },
      {
        onSuccess: (data) => {
          // Extract reset_token from API response
          const token =
            data?.reset_token ||
            data?.data?.reset_token ||
            data?.token ||
            "";
          onSuccess(token);
        },
      }
    );
  };

 return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="forgot-otp-form">

    {apiMessage && (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 animate-fade-in">
        {apiMessage}
      </div>
    )}

    {mutation.isError && (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-fade-in">
        {getApiError(mutation.error)}
      </div>
    )}

    {/* Email badge */}
    

      {/* Email badge */}
      <div className="rounded-lg bg-blue-50 border border-[#000080]/20 px-4 py-3 flex items-center gap-3">
        <Mail className="h-4 w-4 text-[#000080] shrink-0" />
        <p className="text-sm text-[#000080] font-medium truncate">{email}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-otp">One-Time Password (OTP)</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
          <Input
            id="forgot-otp"
            type="text"
            inputMode="numeric"
            placeholder="• • • •"
            maxLength={4}
            className={`pl-10 tracking-[0.5em] text-center text-lg font-bold ${errors.otp ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            {...register("otp")}
          />
        </div>
        {errors.otp && (
          <p className="text-xs text-red-500 animate-fade-in">
            {errors.otp.message}
          </p>
        )}
        <p className="text-xs text-gray-400">
          Check your inbox — OTP may take a few seconds to arrive.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base gap-2"
        disabled={mutation.isPending}
        id="forgot-otp-submit"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify OTP
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-[#000080] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Change email
      </button>
    </form>
  );
}

// ─── Step 3: Reset Password ───────────────────────────────────────────────────
function ResetStep({ resetToken }: { resetToken: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("new_password", "");
  const passwordStrength = passwordRules.filter((r) =>
    r.test(passwordValue)
  ).length;

  const onSubmit = (values: ResetPasswordFormValues) => {
    mutation.mutate({
      reset_token: resetToken,
      new_password: values.new_password,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="forgot-reset-form">
      {mutation.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-fade-in">
          {getApiError(mutation.error)}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="reset-password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={`pl-10 pr-10 ${errors.new_password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            autoComplete="new-password"
            {...register("new_password")}
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
        {errors.new_password && (
          <p className="text-xs text-red-500 animate-fade-in">
            {errors.new_password.message}
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
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  <Check
                    className={`h-3 w-3 ${
                      rule.test(passwordValue) ? "text-green-500" : "text-gray-300"
                    }`}
                  />
                  <span
                    className={
                      rule.test(passwordValue) ? "text-green-600" : "text-gray-400"
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
        <Label htmlFor="reset-confirm">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
          <Input
            id="reset-confirm"
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

      <Button
        type="submit"
        className="w-full h-12 text-base gap-2"
        disabled={mutation.isPending}
        id="reset-password-submit"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Resetting password...
          </>
        ) : (
          <>
            Reset Password
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Page Wrapper ─────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  const meta = STEP_META[step];

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
            <div className="flex h-40 w-40 items-center justify-center rounded-3xl">
              <img src={FivePointCreditWhiteLogo} alt="5PointCredit logo" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Account Recovery
            <br />
            <span className="text-white/70">5PointCredit</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Don't worry, we'll help you get back in.
          </p>

          {/* Step indicators */}
          <div className="mt-10 flex items-center justify-center gap-3">
            {(["email", "otp", "reset"] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step === s
                      ? "bg-white text-[#000080]"
                      : STEP_META[s].step < meta.step
                        ? "bg-white/30 text-white"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {STEP_META[s].step < meta.step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < 2 && (
                  <div
                    className={`w-8 h-0.5 rounded transition-all duration-300 ${
                      STEP_META[s].step < meta.step ? "bg-white/50" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-12 text-xs text-white/50">
            <span>Email</span>
            <span>OTP</span>
            <span>Reset</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl">
              <img src={FivePointCreditBlackLogo} alt="5PointCredit logo" />
            </div>
          </div>

          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            {(["email", "otp", "reset"] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === s
                      ? "bg-[#000080] text-white"
                      : STEP_META[s].step < meta.step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {STEP_META[s].step < meta.step ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < 2 && (
                  <div
                    className={`w-6 h-0.5 rounded ${
                      STEP_META[s].step < meta.step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className="shadow-2xl border-0 ring-1 ring-[#000080]/10">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#000080]/10">
                  <ShieldCheck className="h-5 w-5 text-[#000080]" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{meta.title}</CardTitle>
                  <span className="text-xs text-gray-400 font-medium">
                    Step {meta.step} of 3
                  </span>
                </div>
              </div>
              <CardDescription className="text-sm">
                {meta.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "email" && (
                <EmailStep
                   onSuccess={(email, message) => {
                setEmail(email);
                setApiMessage(message);
                 setStep("otp");
                  }}
                  />
              )}
              {step === "otp" && (
               <OtpStep
               email={email}
               apiMessage={apiMessage}
               onSuccess={(token) => {
                 setResetToken(token);
                 setStep("reset");
                 }}
               onBack={() => setStep("email")}
                />
              )}
              {step === "reset" && <ResetStep resetToken={resetToken} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
