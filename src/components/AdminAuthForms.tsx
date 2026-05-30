import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminSignupForm() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", employeeId: "", adminId: "", code: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.toLowerCase().endsWith("@penflex.org.za")) {
      toast.error("Administrator email must end with @penflex.org.za");
      return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.adminId.trim().length < 3) { toast.error("Administrator ID must be at least 3 characters"); return; }
    setLoading(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/admin?mode=login`,
        data: { full_name: form.fullName, employee_id: form.employeeId, department: "Operations" },
      },
    });
    if (signUpErr) { setLoading(false); toast.error(signUpErr.message); return; }

    if (!signUpData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      });
      if (signInErr) {
        setLoading(false);
        toast.error("Please confirm your email, then return to administrator sign-up to finish setup.");
        return;
      }
    }

    const { error: claimErr } = await supabase.rpc("claim_admin", {
      _code: form.code,
      _admin_id: form.adminId.trim(),
    });
    setLoading(false);
    if (claimErr) { toast.error(claimErr.message); return; }
    await refreshProfile();
    toast.success("Administrator account created!");
    navigate({ to: "/admin" });
  };

  return (
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
        <Input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="admin@penflex.org.za" />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" required minLength={6} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
        <div>
          <Label>Administrator ID</Label>
          <Input required value={form.adminId}
            onChange={(e) => setForm({ ...form, adminId: e.target.value })}
            placeholder="e.g. ADM-001" />
          <p className="text-xs text-muted-foreground mt-1">
            Choose a unique ID. You will be required to enter it every time you sign in.
          </p>
        </div>
        <div>
          <Label>Administrator access code</Label>
          <Input required value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Enter access code" />
          <p className="text-xs text-muted-foreground mt-1">Provided by PENFLEX management.</p>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create administrator account
      </Button>
    </form>
  );
}

export function AdminLoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", adminId: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    });
    if (signInErr || !signInData.user) {
      setLoading(false);
      toast.error(signInErr?.message ?? "Sign-in failed");
      return;
    }

    const { data: ok, error: verifyErr } = await supabase.rpc("verify_admin_id", {
      _admin_id: form.adminId.trim(),
    });
    if (verifyErr || !ok) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("Invalid Administrator ID or this account is not an administrator");
      return;
    }

    setLoading(false);
    toast.success("Welcome back, administrator");
    navigate({ to: "/admin" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="admin@penflex.org.za" />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <div>
        <Label>Administrator ID</Label>
        <Input required value={form.adminId}
          onChange={(e) => setForm({ ...form, adminId: e.target.value })}
          placeholder="Your unique administrator ID" />
        <p className="text-xs text-muted-foreground mt-1">
          Required for every administrator sign-in.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign in as administrator
      </Button>
    </form>
  );
}