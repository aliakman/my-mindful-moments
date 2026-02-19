import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Crown, Check, RotateCcw } from "lucide-react";

type PlanId = "monthly" | "annual" | "lifetime";

interface Plan {
  id: PlanId;
  label: string;
  price: string;
  sub: string;
  badge?: string;
  savings?: string;
}

const PLANS: Plan[] = [
  {
    id: "annual",
    label: "Annual",
    price: "$19.99",
    sub: "per year",
    badge: "Best Value",
    savings: "Save 44%",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$2.99",
    sub: "per month",
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: "$29.99",
    sub: "one-time payment",
    savings: "Pay once, keep forever",
  },
];

const features = [
  "Unlimited collections & sentences",
  "All reminder modes (fixed, random, location)",
  "Custom active hours & intervals",
  "Dark mode & themes",
  "Statistics & streak tracking",
];

/** Paywall screen shown when trial expires and user is not subscribed */
const Paywall = () => {
  const { subscribe, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("annual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4 overflow-y-auto">
      <div className="w-full max-w-sm animate-fade-in py-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/20">
            <Crown className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your Free Trial Ended</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscribe to keep using Remind Me
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 space-y-2.5">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="mt-6 space-y-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative w-full rounded-xl border p-3.5 text-left transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{plan.label}</p>
                  {plan.savings && (
                    <p className="text-[11px] text-primary">{plan.savings}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{plan.price}</p>
                  <p className="text-[11px] text-muted-foreground">{plan.sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-5 space-y-3">
          <Button onClick={subscribe} className="w-full h-12 text-base font-semibold">
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

        <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
          Cancel anytime. Subscription renews automatically.
        </p>
      </div>
    </div>
  );
};

export default Paywall;
