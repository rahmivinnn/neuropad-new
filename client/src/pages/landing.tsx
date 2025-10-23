import { useState } from "react";
// Removed back button; no ArrowLeft or useLocation needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import welcomeImg from "@assets/Image.png";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Back button removed per design update

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Serverless login: store a local user and redirect to dashboard
    try {
      const localUser = {
        id: `local-${Date.now()}`,
        email,
        firstName: email.includes("@") ? email.split("@")[0] : "User",
        lastName: "",
        profileImageUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("neuro_user", JSON.stringify(localUser));

      toast({
        title: "Login Successful",
        description: "Welcome to Neuropad!",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save local session",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 neuropad-bg">
      <div className="w-full max-w-md">
        {/* Header - konsisten dengan onboarding, responsif untuk portrait */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-40 h-40 sm:w-64 sm:h-64 mx-auto flex items-center justify-center mb-4 sm:mb-6">
            <img
              src={welcomeImg}
              alt="Welcome"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome to NeuroPad</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Your personal health monitoring companion for diabetic foot care
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-3 sm:px-6 sm:py-4 rounded-full bg-white neuropad-text-secondary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="input-email"
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3 sm:px-6 sm:py-4 rounded-full bg-white neuropad-text-secondary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="input-password"
          />
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 sm:py-4 rounded-full neuropad-primary neuropad-text-primary font-semibold hover:neuropad-primary-dark transition-colors"
            data-testid="button-login"
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        </form>

        {/* Demo Info */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm neuropad-text-secondary">
            AI-powered neuropathy health monitoring system
          </p>
          <p className="text-xs neuropad-text-secondary mt-1 sm:mt-2">
            Use any email and password to login
          </p>
        </div>
      </div>
    </div>
  );
}
