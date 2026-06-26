import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Tann " }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async (d: { email: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(d.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <AuthShell title="Forgot password?" subtitle="We'll email you a reset link." footer={<Link to="/sign-in" className="text-primary">Back to sign in</Link>}>
      {sent ? (
        <div className="panel p-5 text-sm text-muted-foreground">Check your email for a reset link.</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="email" {...register("email", { required: true })} className="input" placeholder="Email" />
          <button disabled={isSubmitting} className="w-full btn-lime px-4 py-2.5 rounded-md text-sm disabled:opacity-50">Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
