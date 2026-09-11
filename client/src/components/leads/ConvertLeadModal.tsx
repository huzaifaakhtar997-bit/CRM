import React, { useState, useEffect } from "react";
import { Lead, Company, PipelineStage } from "../../types/api.types";
import { leadsApi, ConvertLeadResult } from "../../api/leads.api";
import { companiesApi } from "../../api/companies.api";
import { dealsApi } from "../../api/deals.api";
import { Button } from "../ui/button";
import {
  X, UserCheck, Building2, Briefcase, DollarSign,
  AlertCircle, CheckCircle2, ArrowRight, Loader2
} from "lucide-react";

interface ConvertLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: ConvertLeadResult) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form State
  const [createCompany, setCreateCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const [createDeal, setCreateDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState<number>(1000);
  const [stageId, setStageId] = useState<string>("");

  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<ConvertLeadResult | null>(null);

  // Initialize form when lead changes
  useEffect(() => {
    if (!isOpen || !lead) {
      setConvertedResult(null);
      setError(null);
      return;
    }

    setConvertedResult(null);
    setError(null);

    // If lead has a company name, default to create/link that company
    if (lead.company) {
      setCreateCompany(true);
      setCompanyName(lead.company);
    } else {
      setCreateCompany(false);
      setCompanyName("");
    }
    setSelectedCompanyId("");

    // Deal defaults
    setCreateDeal(false);
    setDealTitle(lead.company ? `${lead.company} - Deal` : `${lead.firstName}'s Deal`);
    setDealValue(1000);

    // Fetch existing companies & stages
    const fetchMetadata = async () => {
      setLoadingInitial(true);
      try {
        const [compRes, stagesRes] = await Promise.all([
          companiesApi.getCompanies({ limit: 100 }),
          dealsApi.getPipelineStages(),
        ]);
        setCompanies(compRes.companies || []);
        setStages(stagesRes || []);
        if (stagesRes && stagesRes.length > 0) {
          setStageId(stagesRes[0].id);
        }
      } catch (err) {
        console.error("Failed to load metadata for conversion:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchMetadata();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverting(true);
    setError(null);

    try {
      const result = await leadsApi.convertLead(lead.id, {
        companyId: selectedCompanyId || undefined,
        createCompany: createCompany && !selectedCompanyId,
        companyName: createCompany && !selectedCompanyId ? companyName.trim() : undefined,
        createDeal,
        dealTitle: createDeal ? dealTitle.trim() : undefined,
        dealValue: createDeal ? Number(dealValue) : undefined,
        stageId: createDeal ? stageId : undefined,
      });

      setConvertedResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to convert lead. Please try again."
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-2.5 text-foreground font-semibold">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Convert Lead to Contact</h3>
              <p className="text-xs text-muted-foreground">
                Promote <span className="text-foreground font-medium">{lead.firstName} {lead.lastName || ""}</span> to a verified contact
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {convertedResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Lead Successfully Converted!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                <strong className="text-foreground">{convertedResult.contact.firstName} {convertedResult.contact.lastName}</strong> is now an active Contact.
                {convertedResult.deal && (
                  <span> A new deal <strong className="text-foreground">"{convertedResult.deal.title}"</strong> was also created.</span>
                )}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Button onClick={onClose} className="gap-2">
                  Done <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConvert} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Contact Info Preview */}
              <div className="bg-accent/20 rounded-lg p-3.5 border space-y-2 text-sm">
                <div className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                  New Contact Record
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Name:</span>
                    <span className="font-medium text-foreground">{lead.firstName} {lead.lastName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Email:</span>
                    <span className="font-medium text-foreground">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div>
                      <span className="text-muted-foreground text-xs block">Phone:</span>
                      <span className="font-medium text-foreground">{lead.phone}</span>
                    </div>
                  )}
                  {lead.jobTitle && (
                    <div>
                      <span className="text-muted-foreground text-xs block">Job Title:</span>
                      <span className="font-medium text-foreground">{lead.jobTitle}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Company Association */}
              <div className="space-y-3 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <label className="text-sm font-semibold text-foreground">Company Association</label>
                  </div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createCompany}
                      onChange={(e) => {
                        setCreateCompany(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedCompanyId("");
                          setCompanyName("");
                        } else if (lead.company) {
                          setCompanyName(lead.company);
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span>Link or Create Company</span>
                  </label>
                </div>

                {createCompany && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Select Existing Company</label>
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => {
                          setSelectedCompanyId(e.target.value);
                          if (e.target.value) {
                            setCompanyName("");
                          }
                        }}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">— Or Create New Company Below —</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.industry ? `(${c.industry})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!selectedCompanyId && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">New Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Create Deal / Opportunity */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <label className="text-sm font-semibold text-foreground">Create Opportunity / Deal</label>
                  </div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createDeal}
                      onChange={(e) => setCreateDeal(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span>Open Deal</span>
                  </label>
                </div>

                {createDeal && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Deal Title *</label>
                      <input
                        type="text"
                        required={createDeal}
                        value={dealTitle}
                        onChange={(e) => setDealTitle(e.target.value)}
                        placeholder="e.g. Enterprise License Deal"
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Value ($ USD)</label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={dealValue}
                            onChange={(e) => setDealValue(Number(e.target.value))}
                            className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Pipeline Stage</label>
                        <select
                          value={stageId}
                          onChange={(e) => setStageId(e.target.value)}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {stages.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.probability}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={converting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={converting || loadingInitial}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Convert to Contact
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
