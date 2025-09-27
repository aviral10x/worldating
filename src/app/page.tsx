import { ProfileCard } from "@/components/ProfileCard";
import { DailyPicksRefresh } from "@/components/DailyPicksRefresh";

export default function Home() {
  return (
    <>
      <ProfileCard />
      <div className="soft-card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Daily Picks</div>
          <p className="text-sm text-[var(--muted-foreground)]">Handpicked profiles based on your interests</p>
        </div>
        <DailyPicksRefresh />
      </div>
    </>
  );
}