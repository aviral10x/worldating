import LikesContent from "./LikesContent";

export default function LikesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stakes & Matches</h1>
        <p className="text-[var(--muted-foreground)] mt-2">People who staked on you and your matches. Stake back to unlock chat once both sides stake.</p>
      </div>
      {/* Client-side content: selectable list + stakeable profile card */}
      <LikesContent />
    </div>
  );
}