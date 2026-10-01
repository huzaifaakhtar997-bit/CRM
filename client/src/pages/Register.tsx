import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invitationsApi, ValidateTokenResponse } from "../api/invitations.api";
import { Lock, Mail, User, Phone, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const token = searchParams.get("token");

  const [loadingValidation, setLoadingValidation] = useState(true);
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingValidation(false);
      return;
    }

    const validate = async () => {
      try {
        const data = await invitationsApi.validateToken(token);
        if (data.valid) {
          setValidationData(data);
        } else {
          setValidationError(data.message || "Invalid or expired invitation token.");
        }
      } catch (err: any) {
        setValidationError(err.response?.data?.message || err.message || "Failed to validate invitation.");
      } finally {
        setLoadingValidation(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      const result = await invitationsApi.registerWithInvite({
        token,
        name: name.trim(),
        password,
        phone: phone.trim() || undefined,
      });

      // Auto-login into session
      setSession(result.user, result.token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "ADMIN": return "Administrator";
      case "MANAGER": return "Sales Manager";
      case "SALES_REP": return "Sales Representative";
      case "MARKETING": return "Marketing Specialist";
      case "SUPPORT": return "Support Specialist";
      default: return role || "Team Member";
    }
  };

  // State 1: No Token Provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-6">
        <div className="w-full max-w-md border bg-card/70 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Registration is Invite-Only
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              New team member registrations require an invitation link from a CRM Administrator. If you are a team member, please request an invite from your admin.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Validating Token
  if (loadingValidation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Validating invitation token...</p>
        </div>
      </div>
    );
  }

  // State 3: Invalid or Expired Token
  if (validationError || !validationData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-sm border border-border/80 bg-card rounded-xl p-6 sm:p-8 shadow-subtle text-center space-y-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-destructive/10 text-destructive rounded-lg mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Invitation Invalid or Expired
            </h1>
            <p className="text-xs text-destructive mt-1.5 leading-relaxed">
              {validationError || "This invitation link is invalid or has already been used."}
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" className="w-full h-8.5 text-xs font-medium">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Valid Token — Registration Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md border border-border/80 bg-card rounded-xl p-6 sm:p-8 shadow-subtle space-y-5 relative">
        {/* Header */}
        <div className="text-center space-y-1.5 relative">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground font-mono font-bold text-base rounded-lg mb-1 shadow-2xs">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Accept Invitation & Join Team
          </h1>
          <p className="text-xs text-muted-foreground">
            Invited by <strong className="text-foreground">{validationData.invitedBy}</strong> to join the CRM platform.
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="flex items-start space-x-2 p-3 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-tight">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 relative">
          {/* Pre-assigned Email (Locked) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Work Email</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Invitation Verified
              </span>
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="email"
                disabled
                value={validationData.email}
                className="w-full bg-muted/60 border border-input rounded-md pl-8 pr-3 h-8.5 text-xs text-foreground font-medium opacity-80 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Assigned Role Badge (Locked) */}
          <div className="p-2.5 rounded-md border border-border/80 bg-muted/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground text-[11px] font-medium block">Pre-Assigned Role:</span>
              <strong className="text-foreground text-xs font-semibold">
                {getRoleDisplayName(validationData.role)}
              </strong>
            </div>
            <span className="px-2 py-0.5 bg-primary/10 text-primary font-semibold rounded border border-primary/20 text-[10px] uppercase tracking-wider">
              {validationData.role}
            </span>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Password *
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
                  className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="tel"
                disabled={isSubmitting}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-8.5 text-xs font-semibold rounded-md shadow-2xs mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Activating Account...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Complete Registration & Join <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/80">
          Already have an active account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
