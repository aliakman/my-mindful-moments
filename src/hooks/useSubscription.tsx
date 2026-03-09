import { createContext, useContext, useState, useCallback } from "react";

type PlanId = "monthly" | "annual" | "lifetime";

interface SubscriptionContextType {
  isTrialActive: boolean;
  trialDaysLeft: number;
  isSubscribed: boolean;
  currentPlan: PlanId | null;
  hasAccess: boolean;
  /** Initiate a subscription — requires explicit user confirmation */
  subscribe: (planId: PlanId) => void;
  /** Confirm the pending purchase */
  confirmPurchase: () => void;
  /** Cancel pending purchase */
  cancelPurchase: () => void;
  /** Plan awaiting confirmation (null if none) */
  pendingPlan: PlanId | null;
  restorePurchases: () => void;
  cancelSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_START_KEY = "remind-me-trial-start";
const SUBSCRIBED_KEY = "remind-me-subscribed";
const PLAN_KEY = "remind-me-plan";
const TRIAL_DAYS = 7;

export const PLANS = [
  {
    id: "annual" as PlanId,
    label: "Yearly",
    price: "$29.99",
    sub: "per year",
    badge: "Popular ⭐",
    savings: "Save 50%",
    monthlyEquiv: "$2.50/mo",
  },
  {
    id: "monthly" as PlanId,
    label: "Monthly",
    price: "$4.99",
    sub: "per month",
  },
  {
    id: "lifetime" as PlanId,
    label: "Lifetime",
    price: "$99.99",
    sub: "one-time payment",
    badge: "Limited 🔥",
    savings: "Pay once, keep forever",
  },
];

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [trialStart] = useState<number>(() => {
    const stored = localStorage.getItem(TRIAL_START_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem(TRIAL_START_KEY, String(now));
    return now;
  });

  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem(SUBSCRIBED_KEY) === "true");
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(() => localStorage.getItem(PLAN_KEY) as PlanId | null);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const elapsed = Date.now() - trialStart;
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / (1000 * 60 * 60 * 24)));
  const isTrialActive = trialDaysLeft > 0;
  const hasAccess = isTrialActive || isSubscribed;

  const subscribe = useCallback((planId: PlanId) => {
    // Don't auto-subscribe — set pending for confirmation
    setPendingPlan(planId);
  }, []);

  const confirmPurchase = useCallback(() => {
    if (!pendingPlan) return;
    // In production, this calls IAP SDK. Mock for now.
    localStorage.setItem(SUBSCRIBED_KEY, "true");
    localStorage.setItem(PLAN_KEY, pendingPlan);
    setIsSubscribed(true);
    setCurrentPlan(pendingPlan);
    setPendingPlan(null);
    console.log(`[Subscription] Confirmed: ${pendingPlan}`);
  }, [pendingPlan]);

  const cancelPurchase = useCallback(() => {
    setPendingPlan(null);
  }, []);

  const restorePurchases = useCallback(() => {
    const restored = localStorage.getItem(SUBSCRIBED_KEY) === "true";
    if (restored) {
      setIsSubscribed(true);
      setCurrentPlan(localStorage.getItem(PLAN_KEY) as PlanId | null);
    }
  }, []);

  const cancelSubscription = useCallback(() => {
    localStorage.removeItem(SUBSCRIBED_KEY);
    localStorage.removeItem(PLAN_KEY);
    setIsSubscribed(false);
    setCurrentPlan(null);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isTrialActive, trialDaysLeft, isSubscribed, currentPlan, hasAccess,
        subscribe, confirmPurchase, cancelPurchase, pendingPlan,
        restorePurchases, cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
