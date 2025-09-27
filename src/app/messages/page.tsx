import MessagesContent from "./MessagesContent";

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Your chats with mutual matches.</p>
      </div>
      <MessagesContent />
    </div>
  );
}