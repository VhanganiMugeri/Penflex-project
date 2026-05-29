import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session && role) {
      navigate({ to: role === "admin" ? "/admin" : "/worker" });
    }
  }, [session, role, authLoading, navigate]);

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary-foreground text-primary grid place-items-center font-bold">P</div>
          <div>
            <div className="font-bold text-lg">PENFLEX</div>
            <div className="text-xs opacity-80">Support System</div>
          </div>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Welcome to your AI-powered workplace support hub.</h2>
          <p className="mt-4 opacity-90 max-w-md">
            Submit tickets in seconds. Our smart engine routes each request to the right team automatically.
          </p>
        </div>
        <div className="text-xs opacity-70">© {new Date().getFullYear()} PENFLEX</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-soft">
          <Tabs value={mode} onValueChange={(v) => navigate({ to: "/auth", search: { mode: v as "login" | "register" } })}>
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="register"><RegisterForm /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign in
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", employeeId: "", department: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.toLowerCase().endsWith("@penflex.org.za")) {
      toast.error("Email must end with @penflex.org.za");
      return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!form.department) { toast.error("Please select a department"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: form.fullName, employee_id: form.employeeId, department: form.department },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Signing you in…");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input id="employeeId" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Department</Label>
        <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {["HR", "IT", "Finance", "Operations"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="r-email">Email</Label>
        <Input id="r-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="r-password">Password</Label>
        <Input id="r-password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create account
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Accounts are created as Worker by default.{" "}
        <Link to="/auth/admin" search={{ mode: "signup" }} className="text-primary hover:underline">Administrator sign-up</Link>
      </p>
    </form>
  );
}

