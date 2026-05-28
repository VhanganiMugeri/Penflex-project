import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge, DeptBadge } from "@/components/TicketBadges";
import { Plus, Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/worker")({ component: WorkerDashboard });

function WorkerDashboard() {
  const { user } = useAuth();
  const { data: tickets = [], refetch } = useQuery({
    queryKey: ["worker-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").eq("worker_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("worker-tickets-rt").on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "Pending").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Track your support tickets at a glance.</p>
        </div>
        <Link to="/worker/new"><Button><Plus className="h-4 w-4 mr-2" /> New ticket</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label="Total" value={stats.total} />
        <StatCard icon={Clock} label="Pending" value={stats.pending} />
        <StatCard icon={AlertCircle} label="In Progress" value={stats.inProgress} />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} />
      </div>

      <Card className="p-6 shadow-card">
        <h2 className="font-semibold text-lg mb-4">Recent tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No tickets yet. Submit your first one!</p>
            <Link to="/worker/new" className="inline-block mt-4"><Button>Create ticket</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Link key={t.id} to="/tickets/$id" params={{ id: t.id }}
                className="block p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <DeptBadge department={t.department} />
                    {t.ai_classification && <DeptBadge department={t.ai_classification} ai />}
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
