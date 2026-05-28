import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { classifyTicket } from "@/lib/ai-classify";
import { DeptBadge } from "@/components/TicketBadges";


export const Route = createFileRoute("/_app/worker/new")({ component: NewTicket });

function NewTicket() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: profile?.full_name ?? "",
    employeeId: profile?.employee_id ?? "",
    department: profile?.department ?? "",
    title: "",
    description: "",
    priority: "Medium",
  });
  const [loading, setLoading] = useState(false);

  const aiResult = useMemo(() => {
    if (!form.title && !form.description) return null;
    return classifyTicket(`${form.title} ${form.description}`);
  }, [form.title, form.description]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.department) { toast.error("Select your department"); return; }
    setLoading(true);
    const ai = classifyTicket(`${form.title} ${form.description}`);
    const { error } = await supabase.from("tickets").insert({
      worker_id: user.id,
      full_name: form.fullName,
      employee_id: form.employeeId,
      department: form.department as any,
      title: form.title,
      description: form.description,
      priority: form.priority as any,
      ai_classification: ai.department,
      ai_confidence: ai.confidence,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket submitted! Admins have been notified.");
    navigate({ to: "/worker" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit a ticket</h1>
        <p className="text-muted-foreground">Describe your issue and our AI will route it automatically.</p>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Full name</Label>
              <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["HR", "IT", "Finance", "Operations"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Issue title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief summary…" />
          </div>
          <div>
            <Label>Detailed description</Label>
            <Textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell us what's going on…" />
          </div>

          {aiResult && (form.title.length > 3 || form.description.length > 10) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium">AI suggested category</div>
                <div className="text-xs text-muted-foreground">
                  Confidence: {Math.round(aiResult.confidence * 100)}%
                </div>
              </div>
              <DeptBadge department={aiResult.department} ai />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit ticket
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/worker" })}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
