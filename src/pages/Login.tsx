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
import bmsLogo from "@/assets/bms-logo.png";
import captureBg from "@/assets/capture.png";

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${captureBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="rounded-3xl p-8 animate-fade-up bg-transparent">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 p-3 mb-6 backdrop-blur-sm border border-white/20">
              <img src={bmsLogo} alt="BMS Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white">BMS Corporate</h1>
            <p className="text-white/80 mt-2">Management Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bms.com"
                  className="pl-12 h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base bg-white text-black hover:bg-white/90" disabled={isLoading}>
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



          <div className="mt-6 text-center text-xs text-white/60">
            © 2026 BMS Corporate. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

