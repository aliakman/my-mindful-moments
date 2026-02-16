import { createContext, useContext, useState, useEffect } from "react";

interface SubscriptionContextType {
  /** Whether user is within 7-day free trial */
  isTrialActive: boolean;
  /** Days remaining in trial (0 if expired) */
  trialDaysLeft: number;
  /** Whether user has an active subscription (mock) */
  isSubscribed: boolean;
  /** Whether user can access the app (trial active OR subscribed) */
  hasAccess: boolean;
  /** Mock: simulate subscribing */
  subscribe: () => void;
  /** Mock: simulate restoring purchases */
  restorePurchases: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_START_KEY = "remind-me-trial-start";
const SUBSCRIBED_KEY = "remind-me-subscribed";
const TRIAL_DAYS = 7;

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [trialStart] = useState<number>(() => {
    const stored = localStorage.getItem(TRIAL_START_KEY);
    if (stored) return parseInt(stored, 10);
    // First open — start trial now
    const now = Date.now();
    localStorage.setItem(TRIAL_START_KEY, String(now));
    return now;
  });

  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem(SUBSCRIBED_KEY) === "true";
  });

  const elapsed = Date.now() - trialStart;
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / (1000 * 60 * 60 * 24)));
  const isTrialActive = trialDaysLeft > 0;
  const hasAccess = isTrialActive || isSubscribed;

  const subscribe = () => {
    // Mock subscription — in production, this would trigger IAP
    localStorage.setItem(SUBSCRIBED_KEY, "true");
    setIsSubscribed(true);
  };

  const restorePurchases = () => {
    // Mock restore — in production, queries App Store / Play Store
    const restored = localStorage.getItem(SUBSCRIBED_KEY) === "true";
    if (restored) setIsSubscribed(true);
  };

  return (
    <SubscriptionContext.Provider
      value={{ isTrialActive, trialDaysLeft, isSubscribed, hasAccess, subscribe, restorePurchases }}
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
