import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminLoginForm, AdminSignupForm } from "@/components/AdminAuthForms";
import { ShieldCheck } from "lucide-react";

type AdminMode = "signup" | "login";

export const Route = createFileRoute("/auth/admin")({
  validateSearch: (s: Record<string, unknown>): { mode: AdminMode } => ({
    mode: s.mode === "login" ? "login" : "signup",
  }),
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const { mode } = Route.useSearch();
  const [tab, setTab] = useState<"signup" | "login">(mode);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => { setTab(mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      const exists = (count ?? 0) > 0;
      setAdminExists(exists);
      if (exists) setTab("login");
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Administrator Portal</h1>
            <p className="text-xs text-muted-foreground">Restricted — PENFLEX management only</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "login")}>
          <TabsList className="grid grid-cols-2 mb-6 w-full">
            <TabsTrigger value="signup" disabled={adminExists === true}>
              Sign up
            </TabsTrigger>
            <TabsTrigger value="login">Sign in</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            {adminExists ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
                An administrator has already been registered. Only one administrator is permitted — please sign in instead.
              </div>
            ) : (
              <AdminSignupForm />
            )}
          </TabsContent>

          <TabsContent value="login">
            <AdminLoginForm />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Link to="/auth" search={{ mode: "login" }} className="text-xs text-muted-foreground hover:text-primary">
            ← Back to worker sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
