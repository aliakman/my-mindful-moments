import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Bell, FolderOpen, Sparkles } from "lucide-react";

const TUTORIAL_KEY = "remind-me-tutorial-complete";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

/** Swipeable onboarding cards shown on first launch */
const slides = [
  {
    icon: BookOpen,
    title: "Welcome to Remind Me",
    description: "Your personal sentence reminder app. Save meaningful sentences and get reminded at the perfect time.",
  },
  {
    icon: FolderOpen,
    title: "Organize Collections",
    description: "Group your sentences into collections. Each collection can have its own reminder schedule.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Choose fixed times, random intervals, or let the app surprise you throughout the day.",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description: "Start creating your first collection and add sentences that matter to you.",
  },
];

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      localStorage.setItem(TUTORIAL_KEY, "true");
      onComplete();
    }
  };

  const skip = () => {
    localStorage.setItem(TUTORIAL_KEY, "true");
    onComplete();
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6 animate-fade-in" key={current}>
        {/* Slide content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{slide.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="mt-10 flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button onClick={next} className="w-full h-11">
            {isLast ? "Get Started" : "Next"}
          </Button>
          {!isLast && (
            <button
              onClick={skip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
export { TUTORIAL_KEY };
