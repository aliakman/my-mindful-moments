/**
 * PermissionGate — Requests all permissions once after login.
 * Shows a brief permission request screen, then never again.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  hasCompletedPermissionFlow,
  requestAllPermissions,
  getPermissionStatus,
  type PermissionStatus,
} from "@/lib/permissionManager";

interface PermissionGateProps {
  children: React.ReactNode;
}

const PermissionGate = ({ children }: PermissionGateProps) => {
  const [needsPermission, setNeedsPermission] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState<PermissionStatus | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasCompletedPermissionFlow()) {
      setChecked(true);
      return;
    }
    setNeedsPermission(true);
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!needsPermission) return <>{children}</>;

  const handleAllow = async () => {
    setRequesting(true);
    const status = await requestAllPermissions();
    setResult(status);
    // Brief pause to show result
    setTimeout(() => setNeedsPermission(false), 1200);
  };

  const handleSkip = () => {
    // Mark as completed even if skipped
    localStorage.setItem("remind-me-permissions-granted", "true");
    setNeedsPermission(false);
  };

  if (result) {
    const allGranted = result.notifications === "granted" && result.location === "granted";
    const anyDenied = result.notifications === "denied" || result.location === "denied";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="mb-4 flex justify-center">
            {allGranted ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10">
                <AlertTriangle className="h-8 w-8 text-accent" />
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold">
            {allGranted ? "All set!" : "Permissions updated"}
          </h2>
          {anyDenied && (
            <p className="mt-2 text-sm text-muted-foreground">
              Some permissions were denied. You can enable them later in your device settings.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Enable Permissions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Remind Me needs a few permissions to work properly. You'll only be asked once.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">Receive reminders at scheduled times</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Location</p>
              <p className="text-xs text-muted-foreground">Trigger reminders when you arrive or leave places</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Button onClick={handleAllow} disabled={requesting} className="w-full h-12 text-base font-semibold">
            {requesting ? "Requesting..." : "Allow All Permissions"}
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionGate;
