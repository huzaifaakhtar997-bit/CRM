import React, { useState, useEffect, useCallback } from "react";
import { usersApi, CRMUser } from "../../api/users.api";
import { invitationsApi, UserInvitation } from "../../api/invitations.api";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  Shield,
  ChevronDown,
  Key,
  UserPlus,
  Mail,
  Copy,
  Check,
  Trash2,
  Clock,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/button";

const ROLES = ["ADMIN", "MANAGER", "SALES_REP", "MARKETING", "SUPPORT"] as const;
const STATUSES = ["ACTIVE", "INACTIVE"] as const;

const getRoleBadge = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "MANAGER":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "SALES_REP":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "MARKETING":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "SUPPORT":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const UsersSettings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const isManagerOrAdmin = isAdmin || currentUser?.role === "MANAGER";

  // Users state
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("SALES_REP");
  const [inviteSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [emailSentStatus, setEmailSentStatus] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Password reset state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<CRMUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      const data = await invitationsApi.getInvitations();
      setInvitations(data);
    } catch (err: any) {
      console.warn("Failed to load invitations:", err?.message);
    }
  }, [isManagerOrAdmin]);

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, [fetchUsers, fetchInvitations]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    setUpdatingId(userId);
    try {
      const updated = await usersApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "INACTIVE") => {
    if (!isAdmin) return;
    setUpdatingId(userId);
    try {
      const updated = await usersApi.updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !resetTargetUser) return;
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    setUpdatingId(resetTargetUser.id);
    setResetError(null);
    try {
      await usersApi.updateUserPassword(resetTargetUser.id, newPassword);
      setResetModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setResetTargetUser(null);
      alert("Password updated successfully.");
    } catch (err: any) {
      setResetError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Create Invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await invitationsApi.createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setCreatedInviteLink(result.inviteUrl);
      setEmailSentStatus(result.emailSent);
      fetchInvitations();
    } catch (err: any) {
      setInviteError(err.response?.data?.message || err.message || "Failed to create invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this invitation? The invite link will become invalid.")) {
      return;
    }
    try {
      await invitationsApi.revokeInvitation(id);
      fetchInvitations();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to revoke invitation.");
    }
  };

  // Copy Link Helper
  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("SALES_REP");
    setCreatedInviteLink(null);
    setInviteError(null);
  };

  const pendingInvitations = invitations.filter((i) => !i.isAccepted && new Date(i.expiresAt) > new Date());

  if (!isManagerOrAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <Shield className="w-5 h-5 mb-2" />
        <p className="font-semibold">Access Restricted</p>
        <p className="mt-1">User management is only available to Admins and Managers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">User Management & Team</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage users, assign roles, and send invite-only onboarding links.
            {!isAdmin && " Only Admins can modify active roles."}
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

      {/* 1. Pending Invitations Section (if any exist) */}
      {pendingInvitations.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-xs space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Pending Team Invitations ({pendingInvitations.length})</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Invite-Only Access Active</span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/40 text-muted-foreground uppercase border-b text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Invited Email</th>
                  <th className="px-4 py-2.5 font-semibold">Assigned Role</th>
                  <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Invited By</th>
                  <th className="px-4 py-2.5 font-semibold hidden lg:table-cell">Expires</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingInvitations.map((inv) => {
                  const inviteUrl = `${window.location.origin}/register?token=${inv.token}`;
                  const isCopied = copiedId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-accent/10">
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadge(inv.role)}`}>
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                        {inv.invitedBy?.name || "Admin"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopy(inviteUrl, inv.id)}
                            className="px-2.5 py-1 text-[11px] font-medium border rounded-md hover:bg-accent flex items-center gap-1 text-foreground transition-colors"
                            title="Copy invitation link"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? "Copied" : "Copy Link"}</span>
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Revoke invitation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Active Users Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Active Team Members ({users.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-sm text-left">
              <thead className="bg-accent/50 text-muted-foreground border-b text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold hidden lg:table-cell">Joined</th>
                  {isAdmin && <th className="px-5 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/10">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin && u.id !== currentUser?.id ? (
                        <div className="relative">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={updatingId === u.id}
                            className={`text-xs font-semibold pl-2 pr-6 py-1 rounded-full border appearance-none cursor-pointer ${getRoleBadge(u.role)}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin && u.id !== currentUser?.id ? (
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value as any)}
                          disabled={updatingId === u.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border appearance-none cursor-pointer ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setResetModalOpen(true);
                            }}
                            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center justify-end gap-1 ml-auto"
                          >
                            <Key className="w-3 h-3" />
                            Reset Password
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No users found.</div>}
          </div>
        )}
      </div>

      {/* 3. Invite User Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" /> Invite Team Member
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate a secure registration link with a locked pre-assigned role.
                </p>
              </div>
              <button onClick={closeInviteModal} className="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {createdInviteLink ? (
                // Success State: Display Link and Copy Action
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Invitation Ready!
                    </div>
                    <p className="text-xs opacity-90">
                      {emailSentStatus
                        ? `An invitation email was sent to ${inviteEmail}.`
                        : `Invitation created for ${inviteEmail}. You can copy the link below.`}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Registration Invite Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdInviteLink}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-muted font-mono select-all"
                      />
                      <Button
                        type="button"
                        onClick={() => handleCopy(createdInviteLink, "modal")}
                        className="shrink-0 h-9"
                      >
                        {copiedId === "modal" ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    This link expires in 7 days and can only be used once. Role is locked to: <strong>{inviteRole}</strong>.
                  </p>

                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" onClick={closeInviteModal} className="w-full">
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                // Form State
                <form onSubmit={handleCreateInvitation} className="space-y-4">
                  {inviteError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Employee Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        disabled={inviteSubmitting}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Assigned Role *
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={inviteSubmitting}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="SALES_REP">Sales Representative (Deals, contacts, inbox)</option>
                      <option value="MANAGER">Sales Manager (Team management, reports, overrides)</option>
                      <option value="SUPPORT">Customer Support (Unified Inbox, tickets)</option>
                      <option value="MARKETING">Marketing (Campaigns, audience segments)</option>
                      {isAdmin && <option value="ADMIN">System Administrator (Full access)</option>}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button type="button" variant="outline" onClick={closeInviteModal} disabled={inviteSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviteSubmitting}>
                      {inviteSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Create & Send Invite
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Password Reset Modal */}
      {resetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-base font-bold text-foreground">Reset Password</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Changing password for <span className="font-semibold text-foreground">{resetTargetUser.name}</span> ({resetTargetUser.email})
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="p-5 space-y-4">
              {resetError && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg">{resetError}</div>}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetTargetUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setResetError(null);
                  }}
                  disabled={updatingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingId !== null || newPassword.length < 6 || newPassword !== confirmPassword}
                >
                  {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
