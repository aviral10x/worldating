import { InterestsPicker } from "@/components/InterestsPicker";

export default function OnboardingPage() {
  return (
    <div className="soft-card p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Pick a few interests so we can personalize your Daily Picks.</p>
      </div>
      {/* Defaults to userId=1 for now; swap with real session user id when auth is wired */}
      <InterestsPicker userId={1} />
    </div>
  );
}