import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { MessageSquare, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/worker/messages")({ component: MessagesPage });

interface AdminMessage {
  id: string;
  message: string;
  created_at: string;
  ticket_id: string;
  responder_id: string;
  tickets: { title: string; worker_id: string } | null;
}

function MessagesPage() {
  const { user } = useAuth();

  const { data: messages = [], refetch, isLoading } = useQuery({
    queryKey: ["worker-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_responses")
        .select("id, message, created_at, ticket_id, responder_id, tickets!inner(title, worker_id)")
        .eq("tickets.worker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Only show messages NOT sent by the worker themselves (i.e. admin replies)
      return (data as unknown as AdminMessage[]).filter((m) => m.responder_id !== user!.id);
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("worker-messages-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_responses" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Replies from administrators on your tickets.</p>
      </div>

      <Card className="p-6 shadow-card">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No messages from administrators yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id}>
                <Link
                  to="/tickets/$id"
                  params={{ id: m.ticket_id }}
                  className="block p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-sm font-medium">
                          Administrator · <span className="text-muted-foreground font-normal">{m.tickets?.title ?? "Ticket"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
