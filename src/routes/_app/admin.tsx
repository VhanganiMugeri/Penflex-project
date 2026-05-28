import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge, DeptBadge } from "@/components/TicketBadges";
import { Ticket, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/_app/admin")({ component: AdminDashboard });

function AdminDashboard() {
  const { data: tickets = [], refetch } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-tickets-rt").on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const [q, setQ] = useState("");
  const [fDept, setFDept] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");
  const [fAI, setFAI] = useState("all");

  const filtered = useMemo(() => tickets.filter((t) => {
    if (fDept !== "all" && t.department !== fDept) return false;
    if (fStatus !== "all" && t.status !== fStatus) return false;
    if (fPriority !== "all" && t.priority !== fPriority) return false;
    if (fAI !== "all" && t.ai_classification !== fAI) return false;
    if (q && !`${t.title} ${t.description} ${t.full_name} ${t.employee_id}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tickets, q, fDept, fStatus, fPriority, fAI]);

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "Pending").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  };

  const deptData = ["HR", "IT", "Finance", "Operations"].map((d) => ({
    dept: d,
    count: tickets.filter((t) => t.department === d).length,
  }));
  const colors = ["oklch(0.38 0.06 50)", "oklch(0.55 0.08 60)", "oklch(0.65 0.06 70)", "oklch(0.45 0.1 40)"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage all support tickets.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label="Total" value={stats.total} />
        <StatCard icon={Clock} label="Pending" value={stats.pending} />
        <StatCard icon={AlertCircle} label="In Progress" value={stats.inProgress} />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card md:col-span-2">
          <h3 className="font-semibold mb-4">Tickets per Department</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={deptData}>
                <XAxis dataKey="dept" stroke="oklch(0.48 0.03 50)" />
                <YAxis stroke="oklch(0.48 0.03 50)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.9 0.015 60)", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {deptData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Recent activity</h3>
          <div className="space-y-3 text-sm max-h-64 overflow-auto">
            {tickets.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{t.full_name}: {t.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-muted-foreground text-sm">No activity yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          {[
            { val: fDept, set: setFDept, label: "Department", opts: ["HR", "IT", "Finance", "Operations"] },
            { val: fStatus, set: setFStatus, label: "Status", opts: ["Pending", "In Progress", "Resolved", "Closed"] },
            { val: fPriority, set: setFPriority, label: "Priority", opts: ["Low", "Medium", "High"] },
            { val: fAI, set: setFAI, label: "AI", opts: ["HR", "IT", "Finance", "Operations"] },
          ].map((f) => (
            <Select key={f.label} value={f.val} onValueChange={f.set}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder={f.label} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label}</SelectItem>
                {f.opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No tickets match your filters.</p>
            </div>
          ) : filtered.map((t) => (
            <Link key={t.id} to="/tickets/$id" params={{ id: t.id }}
              className="block p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.full_name} · {t.employee_id} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
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
