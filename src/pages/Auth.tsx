import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a password reset link.",
        });
        setMode("login");
      }
      setSubmitting(false);
      return;
    }

    if (!password.trim()) { setSubmitting(false); return; }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({
        title: mode === "login" ? "Login failed" : "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (mode === "signup") {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to verify your account.",
      });
    }
    setSubmitting(false);
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Remind Me</h1>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-11 border-border bg-card"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11 border-border bg-card"
              />
            </div>
          )}

          {/* Forgot password link (only on login) */}
          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="h-11 w-full gap-2">
            {submitting
              ? "..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button
              onClick={() => setMode("login")}
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          ) : (
            <>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
