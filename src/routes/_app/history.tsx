import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { StatusBadge, DeptBadge } from "@/components/TicketBadges";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/history")({ component: HistoryPage });

function HistoryPage() {
  const { user, role } = useAuth();
  const { data: tickets = [] } = useQuery({
    queryKey: ["history", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (role !== "admin") q = q.eq("worker_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ticket History</h1>
        <p className="text-muted-foreground">Full audit trail of every ticket.</p>
      </div>

      <Card className="p-0 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                {["Ticket ID", "Employee", "Department", "Issue", "AI", "Status", "Submitted", "Resolved"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No tickets yet.</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to="/tickets/$id" params={{ id: t.id }} className="text-primary hover:underline">{t.id.slice(0, 8)}</Link>
                  </td>
                  <td className="px-4 py-3">{t.full_name}</td>
                  <td className="px-4 py-3"><DeptBadge department={t.department} /></td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{t.title}</td>
                  <td className="px-4 py-3">{t.ai_classification ? <DeptBadge department={t.ai_classification} ai /> : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(t.created_at), "PP")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.resolved_at ? format(new Date(t.resolved_at), "PP") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
