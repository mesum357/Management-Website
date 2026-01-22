import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Mail, Lock, Loader2, Building2, Crown, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import mmhLogo from "@/assets/mmh-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log('[Login] Form submitted', { email, passwordLength: password?.length });

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    console.log('[Login] Calling login function...');

    try {
      const result = await login(email, password);
      console.log('[Login] Login result received', { success: result.success, message: result.message });

      if (result.success) {
        console.log('[Login] Login successful, redirecting...');
        toast({
          title: "Welcome!",
          description: "Login successful",
        });

        // Get the user from localStorage since state might not be updated yet
        const storedUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        console.log('[Login] Stored user from localStorage', { role: storedUser.role });

        // Small delay to ensure state is updated
        setTimeout(() => {
          // Redirect based on role
          if (from) {
            console.log('[Login] Redirecting to from path:', from);
            navigate(from, { replace: true });
          } else if (storedUser.role === 'boss' || storedUser.role === 'manager') {
            console.log('[Login] Redirecting to boss dashboard');
            navigate('/boss', { replace: true });
          } else if (storedUser.role === 'hr' || storedUser.role === 'admin') {
            console.log('[Login] Redirecting to HR dashboard');
            navigate('/hr', { replace: true });
          } else {
            console.log('[Login] Default redirect to HR dashboard');
            navigate('/hr', { replace: true });
          }
        }, 100);
      } else {
        console.error('[Login] Login failed', result.message);
        setError(result.message || "Login failed");
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('[Login] Unexpected error during login', error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 backdrop-blur-sm flex items-center justify-center">
                <img src={mmhLogo} alt="MMH Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold">MMH Corporate</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Management Portal
              </h1>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Access your HR dashboard or Boss view to manage employees,
                track attendance, approve leaves, and oversee operations.
              </p>
            </div>

            {/* Role Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">HR Portal</h3>
                  <p className="text-sm text-white/60">Manage employees, attendance & recruitment</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Boss Dashboard</h3>
                  <p className="text-sm text-white/60">Meetings, tasks & organizational reports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/50">
            © 2026 MMH Corporate. All rights reserved.
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-20 -right-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center">
              <img src={mmhLogo} alt="MMH Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">MMH Corporate</span>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome Back
              </h2>
              <p className="text-muted-foreground">
                Sign in to access the management portal
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    className="pl-12 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground text-center mb-3">
                <strong>Test Accounts:</strong>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-medium text-foreground">HR</p>
                  <p className="text-muted-foreground">hr@company.com</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Boss</p>
                  <p className="text-muted-foreground">boss@company.com</p>
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-2">Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

