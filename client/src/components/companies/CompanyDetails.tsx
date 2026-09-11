import React, { useState, useEffect } from "react";
import { Company, Contact, Deal } from "../../types/api.types";
import { companiesApi } from "../../api/companies.api";
import { dealsApi } from "../../api/deals.api";
import { Button } from "../ui/button";
import { SendEmailModal } from "../contacts/SendEmailModal";
import {
  X, Mail, Phone, Building2, Globe, DollarSign, Users,
  FileText, Calendar, Loader2, TrendingUp, Briefcase, UserCircle2
} from "lucide-react";

interface CompanyDetailsProps {
  company: Company | null;
  onClose: () => void;
  isOpen: boolean;
}

// Stage badge colours
const STAGE_COLORS: Record<string, string> = {
  "#6366f1": "bg-indigo-100 text-indigo-700",
  "#8b5cf6": "bg-violet-100 text-violet-700",
  "#ec4899": "bg-pink-100 text-pink-700",
  "#f59e0b": "bg-amber-100 text-amber-700",
  "#10b981": "bg-emerald-100 text-emerald-700",
  "#ef4444": "bg-red-100 text-red-700",
};

const stageBadgeClass = (color: string | null) =>
  color && STAGE_COLORS[color.toLowerCase()]
    ? STAGE_COLORS[color.toLowerCase()]
    : "bg-muted text-muted-foreground";

const formatCurrency = (value: number, currency = "USD") => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
};

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  onClose,
  isOpen,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Contact | null>(null);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Fetch linked contacts + deals whenever the drawer opens for a company
  useEffect(() => {
    if (!isOpen || !company?.id) {
      setContacts([]);
      setDeals([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [ctxResult, dealsResult] = await Promise.all([
          companiesApi.getCompanyContacts(company.id),
          dealsApi.getDeals({ companyId: company.id, limit: 50 }),
        ]);
        if (!cancelled) {
          setContacts(ctxResult);
          setDeals(dealsResult.deals);
        }
      } catch {
        // Non-fatal: leave empty arrays on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isOpen, company?.id]);

  if (!isOpen || !company) return null;

  const totalPipeline = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const openEmail = (contact: Contact) => {
    setEmailTarget(contact);
    setIsEmailOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
        <div className="bg-card w-full max-w-xl h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0">
            <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* ── Company Profile Header ── */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border border-primary/20 overflow-hidden shadow-sm shrink-0">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  company.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{company.name}</h3>
                <div className="text-sm text-muted-foreground mt-1 flex items-center">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  {company.industry || "No Industry"}
                </div>
              </div>
            </div>

            {/* ── Contact Information ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Website</div>
                    <div className="text-sm text-muted-foreground">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Email</div>
                    <div className="text-sm text-muted-foreground">
                      {company.email ? (
                        <a href={`mailto:${company.email}`} className="text-primary hover:underline">{company.email}</a>
                      ) : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Phone</div>
                    <div className="text-sm text-muted-foreground">
                      {company.phone ? (
                        <a href={`tel:${company.phone}`} className="text-primary hover:underline">{company.phone}</a>
                      ) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Company Profile ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company Profile
              </h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Company Size</div>
                    <div className="text-sm text-muted-foreground">
                      {company.size ? `${company.size} employees` : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Annual Revenue</div>
                    <div className="text-sm text-muted-foreground">
                      {company.annualRevenue ? `$${company.annualRevenue.toLocaleString()}` : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Created Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CRM Metrics ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CRM Metrics
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-accent/30 p-3 rounded-xl border text-center">
                  <div className="text-2xl font-bold text-foreground flex items-center justify-center min-h-[2rem]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : deals.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Deals</div>
                </div>
                <div className="bg-accent/30 p-3 rounded-xl border text-center">
                  <div className="text-2xl font-bold text-foreground flex items-center justify-center min-h-[2rem]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : contacts.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Contacts</div>
                </div>
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 text-center">
                  <div className="text-base font-bold text-primary leading-tight flex items-center justify-center min-h-[2rem]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(totalPipeline)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Pipeline</div>
                </div>
              </div>
            </div>

            {/* ── Linked Contacts ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Linked Contacts ({loading ? "…" : contacts.length})
                </h4>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts…
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No contacts linked to this company yet.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border hover:bg-accent/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {c.firstName.charAt(0).toUpperCase()}{c.lastName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {c.firstName} {c.lastName}
                          </div>
                          {c.jobTitle && (
                            <div className="text-xs text-muted-foreground truncate">{c.jobTitle}</div>
                          )}
                          {c.email && (
                            <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0 ml-2"
                        disabled={!c.email}
                        title={c.email ? `Send email to ${c.firstName}` : "No email address"}
                        onClick={() => openEmail(c)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Linked Deals ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Linked Deals ({loading ? "…" : deals.length})
                </h4>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading deals…
                </div>
              ) : deals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No deals linked to this company yet.</p>
              ) : (
                <div className="space-y-2">
                  {deals.map((d) => (
                    <div key={d.id} className="p-3 bg-accent/20 rounded-lg border hover:bg-accent/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-foreground truncate">{d.title}</div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${stageBadgeClass(d.stage?.color ?? null)}`}
                        >
                          {d.stage?.name ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {formatCurrency(d.value, d.currency)}
                        </span>
                        {d.expectedCloseDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(d.expectedCloseDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Description ── */}
            {company.description && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </h4>
                <div className="flex items-start bg-accent/30 p-3 rounded-lg">
                  <FileText className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground whitespace-pre-wrap">{company.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Email Modal — opened from a contact row inside this panel */}
      <SendEmailModal
        contact={emailTarget}
        isOpen={isEmailOpen}
        onClose={() => { setIsEmailOpen(false); setEmailTarget(null); }}
      />
    </>
  );
};

