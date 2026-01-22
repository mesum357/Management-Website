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
import authBg from "@/assets/auth-bg.jpg";

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
          backgroundImage: `url(${authBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass-card rounded-3xl p-8 shadow-xl animate-fade-up">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 mb-4 shadow-lg flex items-center justify-center">
              <img src={mmhLogo} alt="MMH Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">MMH Corporate</h1>
            <p className="text-muted-foreground mt-2">Management Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
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
                  className="pl-12 h-12 bg-white/70 border-gray-300"
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
                  className="pl-12 pr-12 h-12 bg-white/70 border-gray-300"
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="p-4 rounded-xl bg-gray-50/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground text-center mb-3 font-semibold">
                TEST ACCOUNTS
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <p className="font-bold text-foreground">HR Portal</p>
                  <p className="text-muted-foreground">hr@company.com</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">Boss View</p>
                  <p className="text-muted-foreground">boss@company.com</p>
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-3 text-[10px]">
                Password: <span className="font-mono bg-white px-1 rounded">password123</span>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 MMH Corporate. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

