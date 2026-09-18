import React, { useState, useEffect } from "react";
import {
  Conversation,
  Message,
  Contact,
  SenderType,
  Deal,
  PipelineStage,
  Task,
  TaskType,
  Priority,
} from "../../types/api.types";
import { contactsApi } from "../../api/contacts.api";
import { conversationsApi } from "../../api/conversations.api";
import { dealsApi } from "../../api/deals.api";
import { tasksApi } from "../../api/tasks.api";
import { Button } from "../ui/button";
import {
  User,
  Mail,
  UserPlus,
  Link as LinkIcon,
  Loader2,
  Check,
  X,
  AlertCircle,
  Megaphone,
  Briefcase,
  CalendarPlus,
  ChevronDown,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ConversationDetailsProps {
  conversation: Conversation | null;
  messages?: Message[];
  onConversationUpdated?: () => void;
}

const LIFECYCLE_STAGES = [
  { value: "LEAD", label: "Lead" },
  { value: "MARKETING_QUALIFIED", label: "Marketing Qualified" },
  { value: "SALES_QUALIFIED", label: "Sales Qualified" },
  { value: "OPPORTUNITY", label: "Opportunity" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "EVANGELIST", label: "Evangelist" },
  { value: "OTHER", label: "Other" },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "CALL" as TaskType, label: "Call" },
  { value: "EMAIL" as TaskType, label: "Email" },
  { value: "MEETING" as TaskType, label: "Meeting" },
  { value: "OTHER" as TaskType, label: "Other" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  messages = [],
  onConversationUpdated,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [lifecycle, setLifecycle] = useState<string>("");
  const [savingLifecycle, setSavingLifecycle] = useState(false);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [updatingDealStage, setUpdatingDealStage] = useState<string | null>(null);

  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealStageId, setDealStageId] = useState("");
  const [dealCloseDate, setDealCloseDate] = useState(addDays(30));
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("CALL" as TaskType);
  const [taskDate, setTaskDate] = useState(addDays(1));
  const [taskPriority, setTaskPriority] = useState<Priority>("MEDIUM" as Priority);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const customerMsg = messages.find(
    (m) => m.senderType === SenderType.CUSTOMER && m.senderEmail
  );
  const detectedEmail = customerMsg?.senderEmail || "";
  const rawSenderName = customerMsg?.senderName || detectedEmail.split("@")[0] || "";

  useEffect(() => {
    if (detectedEmail) {
      const parts = rawSenderName.trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setEmail(detectedEmail);
    }
  }, [detectedEmail, rawSenderName]);

  useEffect(() => {
    if (showLinkModal) {
      contactsApi.getContacts({ limit: 100 }).then((res) => {
        setAllContacts(res.contacts || []);
      }).catch(console.error);
    }
  }, [showLinkModal]);

  useEffect(() => {
    if (!conversation?.contactId) {
      setDeals([]);
      setTasks([]);
      return;
    }
    if (conversation.contact?.lifecycleStage) {
      setLifecycle(conversation.contact.lifecycleStage as string);
    }
    dealsApi.getPipelineStages().then((stages) => {
      setPipelineStages(stages);
      if (stages.length > 0 && !dealStageId) setDealStageId(stages[0].id);
    }).catch(console.error);
    dealsApi.getDeals({ contactId: conversation.contactId! }).then((res) => {
      setDeals(res.deals || []);
    }).catch(console.error);
    tasksApi.getTasks({ contactId: conversation.contactId!, completed: false }).then((res) => {
      setTasks(res.tasks || []);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.contactId]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground p-8 text-center text-sm border-l border-border">
        Select a conversation to view details
      </div>
    );
  }

  const { contact, assignedUser } = conversation;

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setCreateError("First name is required."); return; }
    setCreating(true); setCreateError(null);
    try {
      const newContact = await contactsApi.createContact({
        firstName: firstName.trim(), lastName: lastName.trim() || "", email: email.trim().toLowerCase(),
      });
      await conversationsApi.updateConversation(conversation.id, { contactId: newContact.id });
      setShowCreateModal(false);
      if (onConversationUpdated) onConversationUpdated();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || "Failed to create contact.");
    } finally { setCreating(false); }
  };

  const handleLinkContact = async (contactId: string) => {
    if (!contactId) return;
    setLinking(true); setLinkError(null);
    try {
      await conversationsApi.updateConversation(conversation.id, { contactId });
      setShowLinkModal(false);
      if (onConversationUpdated) onConversationUpdated();
    } catch (err: any) {
      setLinkError(err.response?.data?.message || err.message || "Failed to link contact.");
    } finally { setLinking(false); }
  };

  const handleLifecycleChange = async (newStage: string) => {
    if (!contact?.id || !newStage) return;
    setLifecycle(newStage); setSavingLifecycle(true);
    try { await contactsApi.updateContact(contact.id, { lifecycleStage: newStage as any }); }
    catch (err) { console.error("Failed to update lifecycle stage", err); }
    finally { setSavingLifecycle(false); }
  };

  const handleDealStageChange = async (dealId: string, stageId: string) => {
    setUpdatingDealStage(dealId);
    try {
      await dealsApi.updateDealStage(dealId, stageId);
      setDeals((prev) => prev.map((d) => {
        if (d.id !== dealId) return d;
        const stage = pipelineStages.find((s) => s.id === stageId);
        return { ...d, stageId, stage: stage || d.stage };
      }));
    } catch (err) { console.error("Failed to update deal stage", err); }
    finally { setUpdatingDealStage(null); }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim() || !dealStageId) { setDealError("Title and pipeline stage are required."); return; }
    setCreatingDeal(true); setDealError(null);
    try {
      const newDeal = await dealsApi.createDeal({
        title: dealTitle.trim(),
        value: dealValue ? parseFloat(dealValue) : 0,
        stageId: dealStageId,
        contactId: conversation.contactId!,
        expectedCloseDate: new Date(dealCloseDate).toISOString(),
      });
      setDeals((prev) => [...prev, newDeal]);
      setShowDealModal(false); setDealTitle(""); setDealValue("");
    } catch (err: any) {
      setDealError(err.response?.data?.message || err.message || "Failed to create deal.");
    } finally { setCreatingDeal(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDate) { setTaskError("Title and due date are required."); return; }
    setCreatingTask(true); setTaskError(null);
    try {
      const newTask = await tasksApi.createTask({
        title: taskTitle.trim(), taskType, dueDate: new Date(taskDate).toISOString(),
        priority: taskPriority, contactId: conversation.contactId!,
      });
      setTasks((prev) => [...prev, newTask]);
      setShowTaskModal(false); setTaskTitle(""); setTaskDate(addDays(1));
    } catch (err: any) {
      setTaskError(err.response?.data?.message || err.message || "Failed to create task.");
    } finally { setCreatingTask(false); }
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      await tasksApi.updateTask(taskId, { completed: true });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) { console.error("Failed to complete task", err); }
    finally { setCompletingTask(null); }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Conversation Details</h3>
      </div>

      <div className="p-4 space-y-6">
        {(conversation.isFromCampaign || (conversation as any).campaignName) && (
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Campaign Reply</span>
            </div>
            <div className="text-sm font-semibold text-purple-950 dark:text-purple-100">
              {(conversation as any).campaignName || "Marketing Campaign"}
            </div>
            <p className="text-xs text-purple-700/80 dark:text-purple-300/80 leading-relaxed">
              Customer replied directly to this email campaign.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h4>
          {contact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {contact.avatarUrl ? <img src={contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{contact.firstName} {contact.lastName}</div>
                  <Link to="/contacts" className="text-xs text-primary hover:underline">View Profile</Link>
                </div>
              </div>
              {contact.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" title={contact.email}>{contact.email}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Lifecycle Stage</label>
                <div className="relative">
                  <select value={lifecycle} onChange={(e) => handleLifecycleChange(e.target.value)} disabled={savingLifecycle}
                    className="w-full h-8 px-2.5 pr-7 rounded-md border border-input bg-background text-xs appearance-none cursor-pointer disabled:opacity-60">
                    <option value="">Select Stage</option>
                    {LIFECYCLE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  {savingLifecycle && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-primary" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-accent/30 rounded-xl border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5" /><span>Unregistered Sender</span>
              </div>
              <div>
                <div className="font-medium text-sm text-foreground">{rawSenderName || "Unknown"}</div>
                <div className="text-xs text-muted-foreground break-all">{detectedEmail || "No email address found"}</div>
              </div>
              <div className="space-y-1.5">
                <Button size="sm" className="w-full text-xs h-8 gap-1.5" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="w-3.5 h-3.5" /> Add as Contact
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5" onClick={() => setShowLinkModal(true)}>
                  <LinkIcon className="w-3.5 h-3.5" /> Link to Existing
                </Button>
              </div>
            </div>
          )}
        </div>

        {contact && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Deals
              </h4>
              <button onClick={() => setShowDealModal(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {deals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No deals yet.</p>
            ) : (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <div key={deal.id} className="p-2.5 bg-accent/30 rounded-lg border border-border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">{deal.title}</span>
                      {deal.value != null && <span className="text-xs font-semibold text-primary shrink-0">${deal.value.toLocaleString()}</span>}
                    </div>
                    <div className="relative">
                      <select value={deal.stageId || ""} onChange={(e) => handleDealStageChange(deal.id, e.target.value)} disabled={updatingDealStage === deal.id}
                        className="w-full h-7 px-2 pr-6 rounded border border-input bg-background text-xs appearance-none cursor-pointer disabled:opacity-60">
                        {pipelineStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      {updatingDealStage === deal.id && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {contact && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarPlus className="w-3.5 h-3.5" /> Follow-up Tasks
              </h4>
              <button onClick={() => setShowTaskModal(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Schedule
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No open tasks.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 p-2 bg-accent/20 rounded-lg border border-border">
                    <button onClick={() => handleCompleteTask(task.id)} disabled={completingTask === task.id}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-500 transition-colors" title="Mark complete">
                      {completingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="capitalize">{task.taskType?.toLowerCase()}</span>
                        <span>·</span>
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span>
                        {task.priority && (
                          <><span>·</span>
                          <span className={task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-yellow-500" : "text-green-500"}>{task.priority}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignment</h4>
          {assignedUser ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {assignedUser.avatarUrl ? <img src={assignedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-xs font-bold">{assignedUser.name.charAt(0)}</span>}
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">{assignedUser.name}</div>
                <div className="text-xs text-muted-foreground">{assignedUser.email}</div>
              </div>
            </div>
          ) : <div className="text-sm text-muted-foreground italic">Unassigned</div>}
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thread Data</h4>
          <div className="text-xs space-y-2 text-muted-foreground">
            <div className="flex justify-between"><span>Channel:</span><span className="font-medium text-foreground">{conversation.channel}</span></div>
            <div className="flex justify-between"><span>Status:</span><span className="font-medium text-foreground">{conversation.status}</span></div>
            <div className="flex justify-between"><span>Created:</span><span className="font-medium text-foreground">{new Date(conversation.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Add as Contact</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {createError && <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{createError}</span></div>}
            <form onSubmit={handleCreateContact} className="space-y-3 text-sm">
              <div><label className="text-xs text-muted-foreground block mb-1">First Name *</label><input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Email</label><input type="email" value={email} disabled className="w-full h-8 px-2.5 rounded-md border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={creating} className="gap-1.5">{creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Save &amp; Link</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Link Existing Contact</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {linkError && <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{linkError}</span></div>}
            <div className="space-y-3 text-sm">
              <input type="text" placeholder="Search by name or email..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" />
              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border">
                {allContacts.filter((c) => `${c.firstName} ${c.lastName} ${c.email || ""}`.toLowerCase().includes(contactSearch.toLowerCase())).map((c) => (
                  <button key={c.id} type="button" disabled={linking} onClick={() => handleLinkContact(c.id)} className="w-full text-left p-2 hover:bg-accent rounded transition-colors text-xs space-y-0.5">
                    <div className="font-medium text-foreground">{c.firstName} {c.lastName}</div>
                    <div className="text-muted-foreground">{c.email || "No email"}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t"><Button type="button" variant="outline" size="sm" onClick={() => setShowLinkModal(false)}>Cancel</Button></div>
            </div>
          </div>
        </div>
      )}

      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Create Deal</h3>
              <button onClick={() => setShowDealModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {dealError && <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{dealError}</span></div>}
            <form onSubmit={handleCreateDeal} className="space-y-3 text-sm">
              <div><label className="text-xs text-muted-foreground block mb-1">Deal Title *</label><input type="text" required value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} placeholder="e.g. Enterprise License Q4" className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Value ($)</label><input type="number" min="0" step="0.01" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="0" className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Pipeline Stage *</label>
                <select value={dealStageId} onChange={(e) => setDealStageId(e.target.value)} required className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm">
                  <option value="">Select Stage</option>
                  {pipelineStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground block mb-1">Expected Close Date *</label><input type="date" required value={dealCloseDate} onChange={(e) => setDealCloseDate(e.target.value)} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDealModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={creatingDeal} className="gap-1.5">{creatingDeal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Briefcase className="w-3.5 h-3.5" />}Create Deal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Schedule Follow-up Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {taskError && <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{taskError}</span></div>}
            <form onSubmit={handleCreateTask} className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Task Type</label>
                <div className="grid grid-cols-4 gap-1">
                  {TASK_TYPES.map((t) => (
                    <button key={t.value} type="button" onClick={() => setTaskType(t.value)}
                      className={`py-2 rounded-lg border text-xs transition-colors ${taskType === t.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-muted-foreground block mb-1">Title *</label><input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={`Follow up via ${taskType.toLowerCase()}`} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" /></div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Due Date</label>
                <div className="flex gap-1 mb-2">
                  {[{ label: "Today", days: 0 }, { label: "Tomorrow", days: 1 }, { label: "+3d", days: 3 }, { label: "+1wk", days: 7 }].map((p) => (
                    <button key={p.label} type="button" onClick={() => setTaskDate(addDays(p.days))}
                      className={`flex-1 text-xs py-1 rounded border transition-colors ${taskDate === addDays(p.days) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-1">
                  {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                    <button key={p} type="button" onClick={() => setTaskPriority(p)}
                      className={`py-1.5 rounded border text-xs font-medium transition-colors ${taskPriority === p ? (p === "HIGH" ? "bg-red-500 text-white border-red-500" : p === "MEDIUM" ? "bg-yellow-500 text-white border-yellow-500" : "bg-green-500 text-white border-green-500") : "border-border text-muted-foreground hover:bg-accent"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={creatingTask} className="gap-1.5">{creatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
