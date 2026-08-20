import React, { useState, useEffect } from "react";
import { usersApi, CRMUser } from "../../api/users.api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Shield, ChevronDown, Key } from "lucide-react";

const ROLES = ["ADMIN", "MANAGER", "SALES_REP", "MARKETING", "SUPPORT"] as const;
const STATUSES = ["ACTIVE", "INACTIVE"] as const;

const getRoleBadge = (role: string) => {
  switch (role) {
    case "ADMIN": return "bg-destructive/10 text-destructive border-destructive/20";
    case "MANAGER": return "bg-blue-100 text-blue-700 border-blue-200";
    case "SALES_REP": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "MARKETING": return "bg-purple-100 text-purple-700 border-purple-200";
    case "SUPPORT": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-gray-100 text-gray-700";
  }
};

export const UsersSettings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const isManagerOrAdmin = isAdmin || currentUser?.role === "MANAGER";

  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<CRMUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchUsers = async () => {
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
  };

  useEffect(() => { fetchUsers(); }, []);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">User Management</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View users and manage their roles and statuses.
          {!isAdmin && " Only Admins can change roles and statuses."}
        </p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
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
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRoleBadge(u.role)}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isAdmin && u.id !== currentUser?.id ? (
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u.id, e.target.value as any)}
                        disabled={updatingId === u.id}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border appearance-none cursor-pointer ${
                          u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
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
          {users.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold">Reset Password</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Changing password for <span className="font-semibold text-foreground">{resetTargetUser.name}</span> ({resetTargetUser.email})
              </p>
            </div>
            
            <form onSubmit={handlePasswordReset} className="p-5 space-y-4">
              {resetError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {resetError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New Password</label>
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
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetTargetUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setResetError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent"
                  disabled={updatingId !== null}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId !== null || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
