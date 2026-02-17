import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Sun, Moon, Monitor, BookOpen, Crown, LogOut,
  Bell, BellOff, Info, MapPin, BarChart3, Download, Upload
} from "lucide-react";
import { requestNotificationPermission } from "@/lib/notificationScheduler";
import { downloadExport, importData } from "@/lib/exportImport";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  onShowTutorial: () => void;
}

const Settings = ({ onShowTutorial }: SettingsProps) => {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isTrialActive, trialDaysLeft, isSubscribed } = useSubscription();
  const { toast } = useToast();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
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

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const handleNotifToggle = async () => {
    if (notifPermission === "granted") {
      toast({ title: "Notifications enabled", description: "To disable, change browser/device settings." });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    toast({
      title: granted ? "Notifications enabled" : "Permission denied",
      description: granted ? "You'll now receive reminders." : "Enable notifications in your device settings.",
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadExport();
      toast({ title: "Exported", description: "Your data has been downloaded." });
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
        title: "Imported",
        description: `${result.collections} collections and ${result.sentences} sentences added.`,
      });
    } catch {
      toast({ title: "Import failed", description: "Invalid file format.", variant: "destructive" });
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Theme */}
        <section className="rounded-xl bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Appearance</h3>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all ${
                    theme === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {notifPermission === "granted" ? "Notifications are enabled" : "Enable push notifications"}
            </p>
            <button
              onClick={handleNotifToggle}
              className={`rounded-lg p-2 transition-colors ${
                notifPermission === "granted"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {notifPermission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
          </div>
        </section>

        {/* Locations */}
        <section className="rounded-xl bg-card p-4">
          <Link to="/locations" className="flex w-full items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left">My Locations</span>
            <span className="text-xs text-muted-foreground">Manage saved places</span>
          </Link>
        </section>

        {/* Statistics */}
        <section className="rounded-xl bg-card p-4">
          <Link to="/statistics" className="flex w-full items-center gap-3 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left">Statistics</span>
            <span className="text-xs text-muted-foreground">View activity overview</span>
          </Link>
        </section>

        {/* Export / Import */}
        <section className="rounded-xl bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Data</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Export your collections as JSON or import from a backup file.
          </p>
        </section>

        {/* Subscription Status */}
        <section className="rounded-xl bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent" />
            Subscription
          </h3>
          {isSubscribed ? (
            <p className="text-sm text-primary">✓ Active subscription</p>
          ) : isTrialActive ? (
            <div>
              <p className="text-sm text-muted-foreground">
                Free trial: <span className="font-semibold text-foreground">{trialDaysLeft} days left</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${((7 - trialDaysLeft) / 7) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">Trial expired</p>
          )}
        </section>

        {/* Tutorial */}
        <section className="rounded-xl bg-card p-4">
          <button
            onClick={onShowTutorial}
            className="flex w-full items-center gap-3 text-sm"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>View Tutorial Again</span>
          </button>
        </section>

        {/* Account */}
        <section className="rounded-xl bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Account</h3>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <Button variant="outline" size="sm" onClick={signOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </section>

        {/* About */}
        <section className="rounded-xl bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            About
          </h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Remind Me — v1.1.0</p>
            <p>Your personal sentence reminder app with location-based triggers.</p>
            <p className="pt-1 text-muted-foreground/60">© {new Date().getFullYear()} Remind Me</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
