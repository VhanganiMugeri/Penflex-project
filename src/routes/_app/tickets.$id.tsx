import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge, DeptBadge } from "@/components/TicketBadges";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, Send } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/tickets/$id")({ component: TicketDetail });

function TicketDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: ticket, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: responses = [], refetch: refResp } = useQuery({
    queryKey: ["responses", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_responses").select("*").eq("ticket_id", id).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`t-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `id=eq.${id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_responses", filter: `ticket_id=eq.${id}` }, () => refResp())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch, refResp]);

  if (!ticket) return <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isAdmin = role === "admin";

  const updateStatus = async (status: string) => {
    const patch: any = { status };
    if (status === "Resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("tickets").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Status: ${status}`);
  };

  const sendReply = async () => {
    if (!reply.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("ticket_responses").insert({ ticket_id: id, responder_id: user.id, message: reply });
    setSaving(false);
    if (error) toast.error(error.message);
    else { setReply(""); toast.success("Reply sent"); }
  };

  const remove = async () => {
    if (!confirm("Delete this ticket?")) return;
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Ticket deleted"); navigate({ to: isAdmin ? "/admin" : "/worker" }); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: isAdmin ? "/admin" : "/worker" })}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card className="p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ticket.full_name} · {ticket.employee_id} · {format(new Date(ticket.created_at), "PPp")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DeptBadge department={ticket.department} />
            {ticket.ai_classification && <DeptBadge department={ticket.ai_classification} ai />}
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-4 text-sm whitespace-pre-wrap">{ticket.description}</div>

        {isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Select value={ticket.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Pending", "In Progress", "Resolved", "Closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-semibold mb-4">Conversation</h2>
        <div className="space-y-3 mb-4">
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          ) : responses.map((r) => (
            <div key={r.id} className={`p-4 rounded-xl ${r.responder_id === ticket.worker_id ? "bg-muted/50" : "bg-primary/10 border border-primary/20"}`}>
              <div className="text-xs text-muted-foreground mb-1">
                {r.responder_id === ticket.worker_id ? "Employee" : "Administrator"} · {format(new Date(r.created_at), "PPp")}
              </div>
              <div className="text-sm whitespace-pre-wrap">{r.message}</div>
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Textarea rows={3} placeholder="Write a response…" value={reply} onChange={(e) => setReply(e.target.value)} />
            <Button onClick={sendReply} disabled={saving || !reply.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send reply
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
