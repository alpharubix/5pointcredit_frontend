import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
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
import { loginSchema, type LoginFormValues } from "@/lib/zod-schemas";
import { useLogin } from "@/hooks/useAuth";
import FivePointCreditWhiteLogo from "../assets/5PontCreditWhiteLogo.svg";
import FivePointCreditBlackLogo from "../assets/5PontCreditBlackLogo.svg";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => {
  loginMutation.mutate(values);
};

console.log("loginMutation.error =", loginMutation.error);

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
            Welcome Back to
            <br />
            <span className="text-white/70">5PointCredit</span>
          </h1>
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

          <Card className="shadow-2xl border-0 ring-1 ring-[#000080]/10">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-3xl">Sign In</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                id="login-form"
              >
                {/* API Error */}
             {/* {loginMutation.isError && (
  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
    TEST MESSAGE
  </div>
)} */}
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#000080] hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#000080]/40" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-10 pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="current-password"
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
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base gap-2"
                  disabled={loginMutation.isPending}
                  id="login-submit"
                >
                  {loginMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or</span>
                  </div>
                </div>

                {/* Sign up link */}
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-[#000080] hover:underline"
                    id="goto-signup"
                  >
                    Create account
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
