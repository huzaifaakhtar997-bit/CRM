import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../api/dashboard.api";
import { Contact, Deal, Task } from "../types/api.types";
import { MetricCard } from "../components/dashboard/MetricCard";
import { RecentContacts } from "../components/dashboard/RecentContacts";
import { DealsOverview } from "../components/dashboard/DealsOverview";
import { TasksOverview } from "../components/dashboard/TasksOverview";
import { Users, Building2, Briefcase, CheckSquare, Bell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Welcome back");

  // State for metrics
  const [metrics, setMetrics] = useState({
    contacts: { value: null as number | null, loading: true, error: null as string | null },
    companies: { value: null as number | null, loading: true, error: null as string | null },
    deals: { value: null as number | null, loading: true, error: null as string | null },
    tasks: { value: null as number | null, loading: true, error: null as string | null },
    notifications: { value: null as number | null, loading: true, error: null as string | null },
  });

  // State for recent records
  const [recentData, setRecentData] = useState({
    contacts: { data: [] as Contact[], loading: true, error: null as string | null },
    deals: { data: [] as Deal[], loading: true, error: null as string | null },
    tasks: { data: [] as Task[], loading: true, error: null as string | null },
  });

  useEffect(() => {
    // Determine time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    // Reset loading states
    setMetrics({
      contacts: { ...metrics.contacts, loading: true },
      companies: { ...metrics.companies, loading: true },
      deals: { ...metrics.deals, loading: true },
      tasks: { ...metrics.tasks, loading: true },
      notifications: { ...metrics.notifications, loading: true },
    });
    setRecentData({
      contacts: { ...recentData.contacts, loading: true },
      deals: { ...recentData.deals, loading: true },
      tasks: { ...recentData.tasks, loading: true },
    });

    // Fetch Metrics concurrently
    Promise.allSettled([
      dashboardApi.getContactsCount(),
      dashboardApi.getCompaniesCount(),
      dashboardApi.getDealsCount(),
      dashboardApi.getPendingTasksCount(),
      dashboardApi.getUnreadNotificationsCount()
    ]).then((results) => {
      setMetrics(() => ({
        contacts: {
          value: results[0].status === 'fulfilled' ? results[0].value : null,
          loading: false,
          error: results[0].status === 'rejected' ? 'Failed' : null,
        },
        companies: {
          value: results[1].status === 'fulfilled' ? results[1].value : null,
          loading: false,
          error: results[1].status === 'rejected' ? 'Failed' : null,
        },
        deals: {
          value: results[2].status === 'fulfilled' ? results[2].value : null,
          loading: false,
          error: results[2].status === 'rejected' ? 'Failed' : null,
        },
        tasks: {
          value: results[3].status === 'fulfilled' ? results[3].value : null,
          loading: false,
          error: results[3].status === 'rejected' ? 'Failed' : null,
        },
        notifications: {
          value: results[4].status === 'fulfilled' ? results[4].value : null,
          loading: false,
          error: results[4].status === 'rejected' ? 'Failed' : null,
        },
      }));
    });

    // Fetch Recent Data concurrently
    Promise.allSettled([
      dashboardApi.getRecentContacts(),
      dashboardApi.getRecentDeals(),
      dashboardApi.getRecentTasks()
    ]).then((results) => {
      setRecentData(() => ({
        contacts: {
          data: results[0].status === 'fulfilled' ? results[0].value : [],
          loading: false,
          error: results[0].status === 'rejected' ? 'Failed' : null,
        },
        deals: {
          data: results[1].status === 'fulfilled' ? results[1].value : [],
          loading: false,
          error: results[1].status === 'rejected' ? 'Failed' : null,
        },
        tasks: {
          data: results[2].status === 'fulfilled' ? results[2].value : [],
          loading: false,
          error: results[2].status === 'rejected' ? 'Failed' : null,
        },
      }));
    });
  };

  const fetchRecentContacts = () => {
    setRecentData(p => ({ ...p, contacts: { ...p.contacts, loading: true, error: null } }));
    dashboardApi.getRecentContacts()
      .then(data => setRecentData(p => ({ ...p, contacts: { data, loading: false, error: null } })))
      .catch(() => setRecentData(p => ({ ...p, contacts: { data: [], loading: false, error: 'Failed' } })));
  };

  const fetchRecentDeals = () => {
    setRecentData(p => ({ ...p, deals: { ...p.deals, loading: true, error: null } }));
    dashboardApi.getRecentDeals()
      .then(data => setRecentData(p => ({ ...p, deals: { data, loading: false, error: null } })))
      .catch(() => setRecentData(p => ({ ...p, deals: { data: [], loading: false, error: 'Failed' } })));
  };

  const fetchRecentTasks = () => {
    setRecentData(p => ({ ...p, tasks: { ...p.tasks, loading: true, error: null } }));
    dashboardApi.getRecentTasks()
      .then(data => setRecentData(p => ({ ...p, tasks: { data, loading: false, error: null } })))
      .catch(() => setRecentData(p => ({ ...p, tasks: { data: [], loading: false, error: 'Failed' } })));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-bottom duration-500">
      
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {greeting}, {user?.name?.split(' ')[0] || "User"}. Here's what's happening with your CRM today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard 
          title="Total Contacts" 
          value={metrics.contacts.value} 
          loading={metrics.contacts.loading} 
          error={metrics.contacts.error}
          icon={Users}
        />
        <MetricCard 
          title="Total Companies" 
          value={metrics.companies.value} 
          loading={metrics.companies.loading} 
          error={metrics.companies.error}
          icon={Building2}
        />
        <MetricCard 
          title="Total Deals" 
          value={metrics.deals.value} 
          loading={metrics.deals.loading} 
          error={metrics.deals.error}
          icon={Briefcase}
        />
        <MetricCard 
          title="Pending Tasks" 
          value={metrics.tasks.value} 
          loading={metrics.tasks.loading} 
          error={metrics.tasks.error}
          icon={CheckSquare}
          subtitle="To-do"
        />
        <MetricCard 
          title="Unread Messages" 
          value={metrics.notifications.value} 
          loading={metrics.notifications.loading} 
          error={metrics.notifications.error}
          icon={Bell}
          subtitle="Notifications"
        />
      </div>

      {/* Recent Data Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {/* Contacts takes 1 column on XL */}
        <div className="xl:col-span-1 h-[400px]">
          <RecentContacts 
            contacts={recentData.contacts.data}
            loading={recentData.contacts.loading}
            error={recentData.contacts.error}
            onRetry={fetchRecentContacts}
          />
        </div>
        
        {/* Deals takes 1 column on XL */}
        <div className="xl:col-span-1 h-[400px]">
          <DealsOverview 
            deals={recentData.deals.data}
            loading={recentData.deals.loading}
            error={recentData.deals.error}
            onRetry={fetchRecentDeals}
          />
        </div>

        {/* Tasks takes 1 column on XL */}
        <div className="xl:col-span-1 h-[400px]">
          <TasksOverview 
            tasks={recentData.tasks.data}
            loading={recentData.tasks.loading}
            error={recentData.tasks.error}
            onRetry={fetchRecentTasks}
          />
        </div>
      </div>
      
    </div>
  );
};
