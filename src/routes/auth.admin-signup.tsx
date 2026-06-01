import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AdminSignupForm } from "@/components/AdminAuthForms";

export const Route = createFileRoute("/auth/admin-signup")({
  component: AdminSignupPage,
});

function AdminSignupPage() {
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setAdminExists((count ?? 0) > 0);
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-lg p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Administrator Sign Up</h1>
            <p className="text-xs text-muted-foreground">Create the administrator account before signing in</p>
          </div>
        </div>

        {adminExists ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
            An administrator has already been registered. Please use administrator sign in instead.
          </div>
        ) : (
          <AdminSignupForm />
        )}

        <div className="mt-6 flex items-center justify-between text-xs">
          <Link to="/auth" search={{ mode: "register" }} className="text-muted-foreground hover:text-primary">
            ← Employee sign up
          </Link>
          <Link to="/auth/admin" search={{ mode: "login" }} className="text-primary hover:underline">
            Administrator sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}