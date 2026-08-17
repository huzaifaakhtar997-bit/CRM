import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Lock, Mail, AlertCircle, Compass } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-6">
      <div className="w-full max-w-md border bg-card/50 backdrop-blur-md rounded-2xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Decorative subtle background gradient */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-xl mb-2">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access your CRM portal
          </p>
        </div>

        {/* Error Alert */}
        {(formError || error) && (
          <div className="flex items-start space-x-2.5 p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="leading-tight">{formError || error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-accent/40 border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-accent/40 border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 font-semibold transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Contact your administrator if you forgot your credentials.
        </div>
      </div>
    </div>
  );
};

export default Login;
