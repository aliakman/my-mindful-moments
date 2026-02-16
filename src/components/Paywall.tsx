import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Crown, Check, RotateCcw } from "lucide-react";

/** Mock paywall screen shown when trial expires and user is not subscribed */
const Paywall = () => {
  const { subscribe, restorePurchases } = useSubscription();

  const features = [
    "Unlimited collections & sentences",
    "All reminder modes",
    "Custom active hours",
    "Dark mode & themes",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/20">
            <Crown className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Your Free Trial Ended</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscribe to keep using Remind Me
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                <Check className="h-3 w-3 text-success" />
              </div>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-bold text-primary">$0.99</p>
          <p className="text-xs text-muted-foreground">per month</p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button onClick={subscribe} className="w-full h-11">
            Subscribe Now
          </Button>
          <button
            onClick={restorePurchases}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Purchases
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
