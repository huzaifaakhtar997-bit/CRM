import React, { useState, useEffect } from "react";
import { usersApi, CRMUser } from "../../api/users.api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Shield, ChevronDown } from "lucide-react";

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
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
};
