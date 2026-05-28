import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth/admin")({ component: AdminSignup });

function AdminSignup() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", employeeId: "", code: "" });
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setAdminExists((count ?? 0) > 0);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.toLowerCase().endsWith("@penflex.org.za")) {
      toast.error("Administrator email must end with @penflex.org.za");
      return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: form.fullName, employee_id: form.employeeId, department: "Operations" },
      },
    });
    if (signUpErr) { setLoading(false); toast.error(signUpErr.message); return; }

    // If email confirmation is required, signIn will fail silently below; handle by trying sign-in
    if (!signUpData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      });
      if (signInErr) {
        setLoading(false);
        toast.error("Please confirm your email, then sign in and re-enter your access code.");
        return;
      }
    }

    const { error: claimErr } = await supabase.rpc("claim_admin", { _code: form.code });
    setLoading(false);
    if (claimErr) { toast.error(claimErr.message); return; }
    await refreshProfile();
    toast.success("Administrator account created!");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Administrator Sign-up</h1>
            <p className="text-xs text-muted-foreground">Restricted — PENFLEX staff only</p>
          </div>
        </div>

        {adminExists ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
              An administrator has already been registered. Only one administrator is permitted.
            </div>
            <Link to="/auth" search={{ mode: "login" }}>
              <Button variant="outline" className="w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full name</Label>
                <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@penflex.org.za" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>Administrator access code</Label>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Enter access code" />
              <p className="text-xs text-muted-foreground mt-1">Provided by PENFLEX management.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || adminExists === null}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create administrator account
            </Button>
            <Link to="/auth" search={{ mode: "login" }} className="block text-xs text-center text-muted-foreground hover:text-primary">
              Back to worker sign in
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}
