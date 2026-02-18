import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Sun, Moon, Monitor, BookOpen, Crown, LogOut,
  Bell, BellOff, Info, MapPin, BarChart3, Download, Upload,
  Database, Sparkles
} from "lucide-react";
import { requestNotificationPermission } from "@/lib/notificationScheduler";
import { downloadExport, importData } from "@/lib/exportImport";
import { seedSampleData } from "@/lib/sampleData";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  onShowTutorial: () => void;
}

const SettingsRow = ({
  icon: Icon,
  label,
  description,
  onClick,
  href,
  right,
  iconColor = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  right?: React.ReactNode;
  iconColor?: string;
}) => {
  const inner = (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${iconColor}`}>
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
    <button onClick={onClick} className="block w-full p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left">
      {inner}
    </button>
  );
};

const Settings = ({ onShowTutorial }: SettingsProps) => {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isTrialActive, trialDaysLeft, isSubscribed } = useSubscription();
  const { toast } = useToast();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
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

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedSampleData(user.id);
      toast({
        title: "Sample data added ✓",
        description: `${result.collections} collections and ${result.sentences} sentences created.`,
      });
    } catch {
      toast({ title: "Failed to add sample data", variant: "destructive" });
    }
    setSeeding(false);
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const trialProgress = ((7 - trialDaysLeft) / 7) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link to="/" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">

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
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
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

        {/* Reminders & Permissions */}
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
              <div className={`h-2 w-2 rounded-full ${notifPermission === "granted" ? "bg-green-500" : "bg-muted-foreground/40"}`} />
            }
          />
        </section>

        {/* Navigation */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools</p>
          </div>
          <SettingsRow
            icon={MapPin}
            label="My Locations"
            description="Manage saved places for location reminders"
            href="/locations"
            right={<div className="text-muted-foreground/40 text-xs">›</div>}
          />
          <SettingsRow
            icon={BarChart3}
            label="Statistics"
            description="View your reminder activity overview"
            href="/statistics"
            right={<div className="text-muted-foreground/40 text-xs">›</div>}
          />
          <SettingsRow
            icon={BookOpen}
            label="View Tutorial"
            description="Replay the onboarding tutorial"
            onClick={onShowTutorial}
            right={<div className="text-muted-foreground/40 text-xs">›</div>}
          />
        </section>

        {/* Data */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</p>
          </div>
          <SettingsRow
            icon={Download}
            label={exporting ? "Exporting..." : "Export Data"}
            description="Download all collections as JSON backup"
            onClick={handleExport}
            iconColor="text-primary"
          />
          <SettingsRow
            icon={Upload}
            label={importing ? "Importing..." : "Import Data"}
            description="Restore collections from a backup file"
            onClick={() => fileInputRef.current?.click()}
            iconColor="text-primary"
          />
          <SettingsRow
            icon={Sparkles}
            label={seeding ? "Adding samples..." : "Load Sample Collections"}
            description="Explore the app with realistic demo data"
            onClick={handleSeedData}
            iconColor="text-accent"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </section>

        {/* Subscription */}
        <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription</p>
          </div>
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-accent">
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex-1">
              {isSubscribed ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">Active subscription ✓</span>
                </div>
              ) : isTrialActive ? (
                <div>
                  <p className="text-sm font-medium">
                    Free trial — <span className="text-accent">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">$0.99/month after trial</p>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Database className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground truncate flex-1">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-xl bg-card border border-border/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Remind Me v1.2.0 · Your personal reminder companion</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/50 pl-5">© {new Date().getFullYear()} Remind Me. All rights reserved.</p>
        </section>
      </main>
    </div>
  );
};

export default Settings;
