import { InterestsPickerWithSession } from "@/components/InterestsPickerWithSession";

export default function OnboardingPage() {
  return (
    <div className="soft-card p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Pick a few interests so we can personalize your Daily Picks.</p>
      </div>
      {/* Use session-based wrapper instead of hardcoded userId */}
      <InterestsPickerWithSession />
    </div>
  );
}