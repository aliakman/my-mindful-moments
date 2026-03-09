import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Sun, Moon, Monitor, BookOpen, Crown, LogOut,
  Bell, BellOff, Info, MapPin, BarChart3, Download, Upload,
  Database, ChevronDown, ChevronUp, UserCircle, ArrowRight
} from "lucide-react";
import { requestNotificationPermission } from "@/lib/notificationScheduler";
import { downloadExport, importData } from "@/lib/exportImport";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface SettingsProps {
  onShowTutorial: () => void;
}

const SettingsRow = ({
  icon: Icon, label, description, onClick, href, right, iconColor = "text-primary",
}: {
  icon: React.ElementType; label: string; description?: string;
  onClick?: () => void; href?: string; right?: React.ReactNode; iconColor?: string;
}) => {
  const inner = (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
      {right}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block p-3 rounded-xl hover:bg-secondary/60 transition-colors">
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="block w-full p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left min-h-[52px]"
    >
      {inner}
    </button>
  );
};

const Settings = ({ onShowTutorial }: SettingsProps) => {
  const { user, loading, signOut, isGuest, linkAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    isTrialActive, trialDaysLeft, isSubscribed, currentPlan,
    subscribe, confirmPurchase, cancelPurchase, pendingPlan,
  } = useSubscription();
  const { toast } = useToast();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linking, setLinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleNotifToggle = async () => {
    if (notifPermission === "granted") {
      toast({ title: "Notifications enabled", description: "To disable, change your device settings." });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    toast({
      title: granted ? "Notifications enabled ✓" : "Permission denied",
      description: granted ? "You'll now receive reminders." : "Enable notifications in your device settings.",
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadExport();
      toast({ title: "Exported ✓", description: "Your data has been downloaded." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    try {
      const result = await importData(file, user.id);
      toast({
        title: "Imported ✓",
        description: `${result.collections} collections and ${result.sentences} sentences added.`,
      });
    } catch {
      toast({ title: "Import failed", description: "Invalid file format.", variant: "destructive" });
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail.trim() || !linkPassword.trim()) return;
    setLinking(true);
    const { error } = await linkAccount(linkEmail, linkPassword);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created ✓", description: "Your guest data has been transferred to your new account." });
      setShowLinkForm(false);
    }
    setLinking(false);
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const trialProgress = ((7 - trialDaysLeft) / 7) * 100;
  const pendingPlanData = PLANS.find((p) => p.id === pendingPlan);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/"
            aria-label="Back to collections"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Guest banner */}
        {isGuest && (
          <section className="rounded-xl border border-accent/30 bg-accent/5 p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <UserCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">You're using a Guest account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create an account to save your data permanently. Your reminders will be transferred.
                </p>
                {!showLinkForm ? (
                  <Button
                    size="sm"
                    onClick={() => setShowLinkForm(true)}
                    className="mt-3 h-9 gap-1.5"
                  >
                    Create Account
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <form onSubmit={handleLinkAccount} className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="link-email" className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        id="link-email"
                        type="email"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="link-pass" className="text-xs text-muted-foreground">Password</Label>
                      <Input
                        id="link-pass"
                        type="password"
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={linking} className="h-9">
                        {linking ? "Saving..." : "Save Account"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkForm(false)} className="h-9">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
          </div>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    aria-label={`${opt.label} theme`}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all min-h-[64px] ${
                      theme === opt.value
                        ? "border-primary bg-primary/8 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${theme === opt.value ? "text-primary" : ""}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Reminders */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reminders</p>
          </div>
          <SettingsRow
            icon={notifPermission === "granted" ? Bell : BellOff}
            label="Push Notifications"
            description={notifPermission === "granted" ? "Enabled — you'll receive reminders" : "Tap to enable notifications"}
            iconColor={notifPermission === "granted" ? "text-primary" : "text-muted-foreground"}
            onClick={handleNotifToggle}
            right={
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${notifPermission === "granted" ? "bg-green-500" : "bg-muted-foreground/30"}`} />
            }
          />
        </section>

        {/* Tools */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools</p>
          </div>
          <SettingsRow icon={MapPin} label="My Locations" description="Manage saved places for location reminders" href="/locations" right={<div className="text-muted-foreground/40 text-sm">›</div>} />
          <SettingsRow icon={BarChart3} label="Statistics" description="View your reminder activity overview" href="/statistics" right={<div className="text-muted-foreground/40 text-sm">›</div>} />
          <SettingsRow icon={BookOpen} label="View Tutorial" description="Replay the onboarding tutorial" onClick={onShowTutorial} right={<div className="text-muted-foreground/40 text-sm">›</div>} />
        </section>

        {/* Advanced */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advanced</p>
            {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showAdvanced && (
            <div className="border-t border-border/50">
              <SettingsRow icon={Download} label={exporting ? "Exporting..." : "Export Data"} description="Download all collections as JSON backup" onClick={handleExport} />
              <SettingsRow icon={Upload} label={importing ? "Importing..." : "Import Data"} description="Restore collections from a backup file" onClick={() => fileInputRef.current?.click()} />
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
          )}
        </section>

        {/* Subscription */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription</p>
          </div>
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-accent">
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex-1">
              {isSubscribed ? (
                <div>
                  <span className="text-sm font-medium text-primary">Active subscription ✓</span>
                  {currentPlan && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PLANS.find(p => p.id === currentPlan)?.label} plan — {PLANS.find(p => p.id === currentPlan)?.price}
                    </p>
                  )}
                </div>
              ) : isTrialActive ? (
                <div>
                  <p className="text-sm font-medium">
                    Free trial — <span className="text-accent">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${trialProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">$4.99/month after trial</p>
                  <Button onClick={() => subscribe("annual")} size="sm" className="mt-3 w-full h-10 gap-2">
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade Now
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-destructive font-medium">Trial expired · Subscribe to continue</p>
              )}
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Database className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground truncate flex-1">
                {isGuest ? "Guest account" : user.email}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="w-full gap-2 h-11">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-xl bg-card border border-border/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Remind Me v1.4.0 · Your personal reminder companion</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/50 pl-5">
            © {new Date().getFullYear()} Remind Me. All rights reserved.
          </p>
        </section>
      </main>

      {/* Purchase confirmation dialog */}
      <ConfirmDialog
        open={!!pendingPlan}
        onOpenChange={(open) => { if (!open) cancelPurchase(); }}
        title="Confirm Purchase"
        description={pendingPlanData
          ? `Subscribe to the ${pendingPlanData.label} plan for ${pendingPlanData.price} ${pendingPlanData.sub}? You can cancel anytime.`
          : ""}
        onConfirm={confirmPurchase}
        confirmLabel="Confirm & Subscribe"
      />
    </div>
  );
};

export default Settings;
