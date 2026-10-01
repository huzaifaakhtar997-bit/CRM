import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Lock, Mail, AlertCircle } from "lucide-react";

export const Login: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Simple client-side validation
    if (!email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      // Errors handled by AuthContext, displayed below
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-sm border border-border/80 bg-card rounded-xl p-6 sm:p-8 shadow-subtle space-y-5 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground font-mono font-bold text-base rounded-lg mb-1 shadow-2xs">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign in to PULSE CRM
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your credentials to access your pipeline workspace
          </p>
        </div>

        {/* Error Alert */}
        {(formError || error) && (
          <div className="flex items-start space-x-2 p-3 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-tight">{formError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-8.5 text-xs font-semibold shadow-2xs mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-3 space-y-1 border-t border-border/80">
          <p className="font-semibold text-foreground text-[11px]">Invite-Only Platform</p>
          <p className="text-[11px] text-muted-foreground">Contact your organization administrator to receive an onboarding invitation.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
